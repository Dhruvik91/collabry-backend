import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PaymentOrder } from '../../database/entities/payment-order.entity';
import { TopUpPlan } from '../../database/entities/top-up-plan.entity';
import { PaymentStatus, TransactionPurpose, RazorpayWebhookEvent } from '../../database/entities/enums';
import { RazorpayService } from './razorpay.service';
import { WalletService } from '../kc-wallet/wallet.service';
import { InitiateTopUpDto, VerifyPaymentDto } from './dto/payment.dto';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        @InjectRepository(PaymentOrder)
        private readonly orderRepo: Repository<PaymentOrder>,
        @InjectRepository(TopUpPlan)
        private readonly planRepo: Repository<TopUpPlan>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly razorpayService: RazorpayService,
        private readonly walletService: WalletService,
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
        private readonly mailerService: MailerService,
    ) { }

    async initiateTopUp(userId: string, dto: InitiateTopUpDto) {
        const plan = await this.planRepo.findOne({ where: { id: dto.planId, isActive: true } });
        if (!plan) throw new NotFoundException('Top-up plan not found or inactive');

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Create Local Order first to get an ID
        const order = this.orderRepo.create({
            user: { id: userId } as any,
            plan: plan,
            amount: plan.amount,
            coins: plan.coins,
            status: PaymentStatus.PENDING,
            razorpayOrderId: 'PENDING', // Temporary
        });

        const savedOrder = await this.orderRepo.save(order);

        // Create Razorpay Order
        const razorpayOrder = await this.razorpayService.createOrder(
            plan.amount,
            'INR',
            savedOrder.id, // UUID is 36 chars, fits in 40
            {
                userId: user.id,
                email: user.email,
                username: user.username || 'N/A',
                planId: plan.id,
                coins: plan.coins,
                localOrderId: savedOrder.id,
            }
        );

        // Update local order with Razorpay Order ID
        savedOrder.razorpayOrderId = razorpayOrder.id;
        await this.orderRepo.save(savedOrder);

        return {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: this.configService.get<string>('RAZORPAY_KEY_ID'),
            prefill: {
                name: user.username || 'User',
                email: user.email,
            },
        };
    }

    async verifyPayment(userId: string, dto: VerifyPaymentDto) {
        // First check outside to avoid unnecessary locks
        const initialOrder = await this.orderRepo.findOne({
            where: { razorpayOrderId: dto.razorpayOrderId },
            relations: ['user', 'plan'],
        });

        if (!initialOrder) throw new NotFoundException('Order not found');
        if (initialOrder.user.id !== userId) throw new BadRequestException('Unauthorized payment verification');
        if (initialOrder.status === PaymentStatus.SUCCESS) return { message: 'Payment already verified' };

        // Verify Signature
        const isValid = this.razorpayService.verifySignature(
            dto.razorpayOrderId,
            dto.razorpayPaymentId,
            dto.razorpaySignature,
        );

        if (!isValid) {
            initialOrder.status = PaymentStatus.FAILED;
            await this.orderRepo.save(initialOrder);
            throw new BadRequestException('Invalid payment signature');
        }

        // Verify Amount
        const paymentDetails = await this.razorpayService.getPaymentDetails(dto.razorpayPaymentId);
        const paidAmount = Number(paymentDetails.amount) / 100; // Convert paise to INR
        if (Math.abs(paidAmount - Number(initialOrder.amount)) > 0.01) {
            this.logger.error(`Amount mismatch for order ${initialOrder.id}. Expected: ${initialOrder.amount}, Paid: ${paidAmount}`);
            initialOrder.status = PaymentStatus.FAILED;
            await this.orderRepo.save(initialOrder);
            throw new BadRequestException('Payment amount mismatch');
        }

        // Use transaction with pessimistic lock for final update
        return await this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(PaymentOrder, {
                where: { id: initialOrder.id },
                lock: { mode: 'pessimistic_write' },
            });

            if (!order) throw new NotFoundException('Order lost during transaction');
            if (order.status === PaymentStatus.SUCCESS) {
                return { status: 'already_verified', message: 'Payment already processed' };
            }

            order.status = PaymentStatus.SUCCESS;
            order.razorpayPaymentId = dto.razorpayPaymentId;
            order.razorpaySignature = dto.razorpaySignature;
            order.metadata = { ...(order.metadata || {}), verify_api_response: paymentDetails };
            await manager.save(order);

            // Credit Coins to Wallet
            await this.walletService.credit(
                userId,
                order.coins,
                TransactionPurpose.KCOIN_TOPUP,
                {
                    paymentOrderId: order.id,
                    razorpayPaymentId: dto.razorpayPaymentId,
                    method: 'api_verify'
                },
                manager,
            );

            // Send Success Email
            void this.mailerService.sendPaymentSuccessEmail(
                initialOrder.user.email,
                initialOrder.user.username || 'User',
                Number(order.amount),
                order.coins,
                order.razorpayOrderId
            ).catch(err => this.logger.error('Failed to send payment success email:', err));

            return {
                status: 'success',
                coinsCredited: order.coins,
                newBalance: (await this.walletService.getWallet(userId)).balance,
            };
        });
    }

    async cancelOrder(userId: string, orderId: string) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, user: { id: userId } }
        });

        if (!order) throw new NotFoundException('Order not found');
        if (order.status !== PaymentStatus.PENDING) {
            return { status: order.status, message: `Cannot cancel order in ${order.status} status` };
        }

        order.status = PaymentStatus.CANCELLED;
        await this.orderRepo.save(order);
        this.logger.log(`Order ${orderId} cancelled by user ${userId}`);
        return { status: 'cancelled' };
    }

    async syncOrderStatus(userId: string, orderId: string) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, user: { id: userId } },
            relations: ['user']
        });

        if (!order) throw new NotFoundException('Order not found');
        if (order.status === PaymentStatus.SUCCESS) return { status: 'success', message: 'Already completed' };

        try {
            const rzpOrder = await this.razorpayService.fetchOrder(order.razorpayOrderId);
            const rzpPayments = await this.razorpayService.fetchOrderPayments(order.razorpayOrderId);

            const successfulPayment = rzpPayments?.items?.find((p: any) => p.status === 'captured');

            if (successfulPayment) {
                // If we found a successful payment, trigger verification logic
                return await this.dataSource.transaction(async (manager) => {
                    const lockedOrder = await manager.findOne(PaymentOrder, {
                        where: { id: order.id },
                        lock: { mode: 'pessimistic_write' },
                    });

                    if (lockedOrder && lockedOrder.status !== PaymentStatus.SUCCESS) {
                        lockedOrder.status = PaymentStatus.SUCCESS;
                        lockedOrder.razorpayPaymentId = successfulPayment.id;
                        lockedOrder.metadata = { ...(lockedOrder.metadata || {}), sync_at: new Date(), rzp_payment: successfulPayment };
                        await manager.save(lockedOrder);

                        await this.walletService.credit(
                            order.user.id,
                            lockedOrder.coins,
                            TransactionPurpose.KCOIN_TOPUP,
                            { paymentOrderId: lockedOrder.id, via: 'manual_sync' },
                            manager
                        );

                        return { status: 'success', coinsCredited: lockedOrder.coins };
                    }
                    return { status: lockedOrder.status };
                });
            }

            // No captured payment found, check if there's a failed one
            const failedPayment = rzpPayments?.items?.find((p: any) => p.status === 'failed');
            if (failedPayment && order.status !== PaymentStatus.FAILED) {
                order.status = PaymentStatus.FAILED;
                order.metadata = { ...(order.metadata || {}), rzp_sync_failure: failedPayment };
                await this.orderRepo.save(order);
                return { status: 'failed', reason: failedPayment.error_description };
            }

            return { status: order.status, rzpStatus: rzpOrder.status, message: 'No captured payment found yet' };
        } catch (error) {
            this.logger.error(`Failed to sync order ${orderId}:`, error);
            throw new BadRequestException('Failed to sync with payment gateway');
        }
    }

    async handleWebhook(payload: any, signature: string, rawBody?: string) {
        const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
        if (!webhookSecret || !signature || !rawBody) {
            this.logger.warn('RAZORPAY_WEBHOOK_SECRET not configured or missing signature/body, skipping webhook verification');
            return;
        }

        // Verify Signature using rawBody
        const isValid = this.razorpayService.verifyWebhookSignature(
            rawBody,
            signature,
            webhookSecret,
        );

        if (!isValid) {
            throw new BadRequestException('Invalid webhook signature');
        }

        const event = payload.event as RazorpayWebhookEvent;
        const razorpayOrderId = payload.payload.payment?.entity?.order_id || payload.payload.order?.entity?.id;
        const razorpayPaymentId = payload.payload.payment?.entity?.id;

        if (!razorpayOrderId) return;

        const initialOrder = await this.orderRepo.findOne({
            where: { razorpayOrderId },
            relations: ['user'],
        });

        if (!initialOrder) {
            this.logger.warn(`Webhook received for unknown order: ${razorpayOrderId}`);
            return;
        }

        switch (event) {
            case RazorpayWebhookEvent.PAYMENT_CAPTURED:
            case RazorpayWebhookEvent.ORDER_PAID:
                if (initialOrder.status === PaymentStatus.SUCCESS) return;

                await this.dataSource.transaction(async (manager) => {
                    const order = await manager.findOne(PaymentOrder, {
                        where: { id: initialOrder.id },
                        lock: { mode: 'pessimistic_write' },
                    });

                    if (order && order.status !== PaymentStatus.SUCCESS) {
                        // Verify Amount from Webhook Payload
                        const paidAmountInPaise = payload.payload.payment?.entity?.amount;
                        if (paidAmountInPaise) {
                            const paidAmount = Number(paidAmountInPaise) / 100;
                            if (Math.abs(paidAmount - Number(order.amount)) > 0.01) {
                                this.logger.error(`Webhook Amount mismatch for order ${order.id}. Expected: ${order.amount}, Paid: ${paidAmount}`);
                                order.status = PaymentStatus.FAILED;
                                order.razorpayPaymentId = razorpayPaymentId;
                                await manager.save(order);
                                return;
                            }
                        }

                        order.status = PaymentStatus.SUCCESS;
                        order.razorpayPaymentId = razorpayPaymentId;
                        order.razorpaySignature = signature; // Store webhook signature/header for record
                        order.metadata = { ...(order.metadata || {}), webhook_last_event: event, webhook_payload: payload };
                        await manager.save(order);

                        await this.walletService.credit(
                            initialOrder.user.id,
                            order.coins,
                            TransactionPurpose.KCOIN_TOPUP,
                            {
                                paymentOrderId: order.id,
                                razorpayPaymentId,
                                via: 'webhook',
                                event: event
                            },
                            manager,
                        );

                        // Send Success Email
                        void this.mailerService.sendPaymentSuccessEmail(
                            initialOrder.user.email,
                            initialOrder.user.username || 'User',
                            Number(order.amount),
                            order.coins,
                            order.razorpayOrderId
                        ).catch(err => this.logger.error('Failed to send payment success email (webhook):', err));
                    }
                });
                break;
            case RazorpayWebhookEvent.PAYMENT_FAILED:
                initialOrder.status = PaymentStatus.FAILED;
                initialOrder.razorpayPaymentId = razorpayPaymentId;
                initialOrder.metadata = {
                    ...(initialOrder.metadata || {}),
                    failure_reason: payload.payload.payment?.entity?.error_description,
                    failure_code: payload.payload.payment?.entity?.error_code,
                    webhook_payload: payload
                };
                await this.orderRepo.save(initialOrder);
                this.logger.log(`Payment failed for order ${razorpayOrderId}: ${initialOrder.metadata.failure_reason}`);
                break;
            case RazorpayWebhookEvent.REFUND_PROCESSED:
                initialOrder.status = PaymentStatus.REFUNDED;
                initialOrder.metadata = { ...(initialOrder.metadata || {}), last_webhook_event: event, refund_payload: payload };
                await this.orderRepo.save(initialOrder);
                this.logger.warn(`Refund processed for order ${razorpayOrderId}. Internal status updated to REFUNDED.`);
                break;
            default:
                this.logger.log(`Webhook received for unhandled event: ${event}`);
                break;
        }
    }

    async getMyOrders(userId: string, page = 1, limit = 20) {
        const [items, total] = await this.orderRepo.findAndCount({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
            relations: ['plan'],
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
