import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PaymentOrder } from '../../database/entities/payment-order.entity';
import { TopUpPlan } from '../../database/entities/top-up-plan.entity';
import { PaymentStatus, TransactionPurpose } from '../../database/entities/enums';
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

        // Create Razorpay Order
        const razorpayOrder = await this.razorpayService.createOrder(
            plan.amount,
            'INR',
            `topup_${userId}_${Date.now()}`,
            {
                userId: user.id,
                email: user.email,
                username: user.username || 'N/A',
                planId: plan.id,
                coins: plan.coins,
            }
        );

        // Create Local Order
        const order = this.orderRepo.create({
            user: { id: userId } as any,
            plan: plan,
            razorpayOrderId: razorpayOrder.id,
            amount: plan.amount,
            coins: plan.coins,
            status: PaymentStatus.PENDING,
        });

        await this.orderRepo.save(order);

        return {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: this.configService.get<string>('RAZORPAY_KEY_ID'), // Frontend will need this
        };
    }

    async verifyPayment(userId: string, dto: VerifyPaymentDto) {
        const order = await this.orderRepo.findOne({
            where: { razorpayOrderId: dto.razorpayOrderId },
            relations: ['user', 'plan'],
        });

        if (!order) throw new NotFoundException('Order not found');
        if (order.user.id !== userId) throw new BadRequestException('Unauthorized payment verification');
        if (order.status === PaymentStatus.SUCCESS) return { message: 'Payment already verified' };

        // Verify Signature
        const isValid = this.razorpayService.verifySignature(
            dto.razorpayOrderId,
            dto.razorpayPaymentId,
            dto.razorpaySignature,
        );

        if (!isValid) {
            order.status = PaymentStatus.FAILED;
            await this.orderRepo.save(order);
            throw new BadRequestException('Invalid payment signature');
        }

        // Use transaction to update order and credit wallet
        return await this.dataSource.transaction(async (manager) => {
            order.status = PaymentStatus.SUCCESS;
            order.razorpayPaymentId = dto.razorpayPaymentId;
            order.razorpaySignature = dto.razorpaySignature;
            await manager.save(order);

            // Credit Coins to Wallet
            await this.walletService.credit(
                userId,
                order.coins,
                TransactionPurpose.KCOIN_TOPUP,
                { paymentOrderId: order.id, razorpayPaymentId: dto.razorpayPaymentId },
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
                newBalance: (await this.walletService.getWallet(userId)).balance, // Potentially stale if not using manager, but getWallet doesn't take manager
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

        const event = payload.event;
        if (event === 'payment.captured' || event === 'order.paid') {
            const razorpayOrderId = payload.payload.payment?.entity?.order_id || payload.payload.order?.entity?.id;
            const razorpayPaymentId = payload.payload.payment?.entity?.id;

            if (razorpayOrderId) {
                const order = await this.orderRepo.findOne({
                    where: { razorpayOrderId },
                    relations: ['user'],
                });

                if (order && order.status !== PaymentStatus.SUCCESS) {
                    await this.dataSource.transaction(async (manager) => {
                        order.status = PaymentStatus.SUCCESS;
                        order.razorpayPaymentId = razorpayPaymentId;
                        await manager.save(order);

                        await this.walletService.credit(
                            order.user.id,
                            order.coins,
                            TransactionPurpose.KCOIN_TOPUP,
                            { paymentOrderId: order.id, razorpayPaymentId, via: 'webhook' },
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
                    });
                }
            }
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
