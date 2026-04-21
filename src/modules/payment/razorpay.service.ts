import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
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
            console.error('Razorpay Order Creation Error:', error);
            throw new InternalServerErrorException('Failed to create Razorpay order');
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
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');

        return expectedSignature === signature;
    }
}
