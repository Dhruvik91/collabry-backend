import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
    private readonly logger = new Logger(RazorpayService.name);
    private razorpay: any;

    constructor(private configService: ConfigService) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
        });
    }

    async createOrder(amount: number, currency = 'INR', receipt: string, notes: any = {}) {
        try {
            const options = {
                amount: Math.round(amount * 100), // Razorpay expects amount in paise
                currency,
                receipt,
                notes,
            };
            return await this.razorpay.orders.create(options);
        } catch (error) {
            this.logger.error('Razorpay Order Creation Error:', error);
            throw new InternalServerErrorException('Failed to create Razorpay order');
        }
    }

    async getPaymentDetails(paymentId: string) {
        try {
            return await this.razorpay.payments.fetch(paymentId);
        } catch (error) {
            this.logger.error(`Razorpay Payment Fetch Error for ${paymentId}:`, error);
            throw new InternalServerErrorException('Failed to fetch payment details from Razorpay');
        }
    }

    async fetchOrder(orderId: string) {
        try {
            return await this.razorpay.orders.fetch(orderId);
        } catch (error) {
            this.logger.error(`Razorpay Order Fetch Error for ${orderId}:`, error);
            throw new InternalServerErrorException('Failed to fetch order from Razorpay');
        }
    }

    async fetchOrderPayments(orderId: string) {
        try {
            return await this.razorpay.orders.fetchPayments(orderId);
        } catch (error) {
            this.logger.error(`Razorpay Order Payments Fetch Error for ${orderId}:`, error);
            throw new InternalServerErrorException('Failed to fetch order payments from Razorpay');
        }
    }

    verifySignature(orderId: string, paymentId: string, signature: string): boolean {
        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        return generatedSignature === signature;
    }

    verifyWebhookSignature(payload: string, signature: string, webhookSecret: string): boolean {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');

            return expectedSignature === signature;
        } catch (error) {
            this.logger.error('Razorpay Webhook Signature Verification Error:', error);
            return false;
        }
    }
}
