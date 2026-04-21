import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

        // Use transaction with pessimistic lock for final update
        return await this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(PaymentOrder, {
                where: { id: initialOrder.id },
                relations: ['user'],
                lock: { mode: 'pessimistic_write' },
            });

            if (!order) throw new NotFoundException('Order lost during transaction');
            if (order.status === PaymentStatus.SUCCESS) {
                return { status: 'already_verified', message: 'Payment already processed' };
            }

            order.status = PaymentStatus.SUCCESS;
            order.razorpayPaymentId = dto.razorpayPaymentId;
            order.razorpaySignature = dto.razorpaySignature;
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
                order.user.email,
                order.user.username || 'User',
                Number(order.amount),
                order.coins,
                order.razorpayOrderId
            ).catch(err => console.error('Failed to send payment success email:', err));

            return {
                status: 'success',
                coinsCredited: order.coins,
                newBalance: (await this.walletService.getWallet(userId)).balance,
            };
        });
    }

    async handleWebhook(payload: any, signature: string) {
        const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
        if (!webhookSecret) {
            console.warn('RAZORPAY_WEBHOOK_SECRET not configured, skipping webhook verification');
            return;
        }

        // Verify Signature
        const isValid = this.razorpayService.verifyWebhookSignature(
            JSON.stringify(payload),
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
            console.warn(`Webhook received for unknown order: ${razorpayOrderId}`);
            return;
        }

        if (event === RazorpayWebhookEvent.PAYMENT_CAPTURED || event === RazorpayWebhookEvent.ORDER_PAID) {
            if (initialOrder.status === PaymentStatus.SUCCESS) return;

            await this.dataSource.transaction(async (manager) => {
                const order = await manager.findOne(PaymentOrder, {
                    where: { id: initialOrder.id },
                    relations: ['user'],
                    lock: { mode: 'pessimistic_write' },
                });

                if (order && order.status !== PaymentStatus.SUCCESS) {
                    order.status = PaymentStatus.SUCCESS;
                    order.razorpayPaymentId = razorpayPaymentId;
                    await manager.save(order);

                    await this.walletService.credit(
                        order.user.id,
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
                        order.user.email,
                        order.user.username || 'User',
                        Number(order.amount),
                        order.coins,
                        order.razorpayOrderId
                    ).catch(err => console.error('Failed to send payment success email (webhook):', err));
                }
            });
        } else if (event === RazorpayWebhookEvent.PAYMENT_FAILED) {
            initialOrder.status = PaymentStatus.FAILED;
            initialOrder.razorpayPaymentId = razorpayPaymentId;
            await this.orderRepo.save(initialOrder);
            console.log(`Payment failed for order ${razorpayOrderId}`);
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
