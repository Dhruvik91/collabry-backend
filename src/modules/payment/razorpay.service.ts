import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Razorpay from "razorpay";
import * as crypto from "crypto";

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: any;

  constructor(private configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>("RAZORPAY_KEY_ID"),
      key_secret: this.configService.get<string>("RAZORPAY_KEY_SECRET"),
    });
  }

  async createOrder(
    amount: number,
    currency = "INR",
    receipt: string,
    notes: any = {},
  ) {
    try {
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt,
        notes,
      };
      return await this.razorpay.orders.create(options);
    } catch (error) {
      this.logger.error("Razorpay Order Creation Error:", error);
      throw new InternalServerErrorException("Failed to create Razorpay order");
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      this.logger.error(
        `Razorpay Payment Fetch Error for ${paymentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        "Failed to fetch payment details from Razorpay",
      );
    }
  }

  async fetchOrder(orderId: string) {
    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      this.logger.error(`Razorpay Order Fetch Error for ${orderId}:`, error);
      throw new InternalServerErrorException(
        "Failed to fetch order from Razorpay",
      );
    }
  }

  async fetchOrderPayments(orderId: string) {
    try {
      return await this.razorpay.orders.fetchPayments(orderId);
    } catch (error) {
      this.logger.error(
        `Razorpay Order Payments Fetch Error for ${orderId}:`,
        error,
      );
      throw new InternalServerErrorException(
        "Failed to fetch order payments from Razorpay",
      );
    }
  }

  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const secret = this.configService.get<string>("RAZORPAY_KEY_SECRET");
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    return generatedSignature === signature;
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string,
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
      this.logger.error(
        "Razorpay Webhook Signature Verification Error:",
        error,
      );
      return false;
    }
  }

  async createRazorpayPlan(
    name: string,
    amount: number,
    period: "daily" | "weekly" | "monthly" | "yearly",
  ) {
    try {
      return await this.razorpay.plans.create({
        period,
        interval: 1,
        item: {
          name: `${name} Subscription Plan`,
          amount: Math.round(amount * 100), // in paise
          currency: "INR",
          description: `Plan for ${name} access`,
        },
      });
    } catch (error) {
      this.logger.error("Razorpay Plan Creation Error:", error);
      throw new InternalServerErrorException("Failed to create plan on Razorpay");
    }
  }

  async createSubscription(
    razorpayPlanId: string,
    totalCount = 120,
    customerDetails?: { email: string; name: string },
  ) {
    try {
      const payload: any = {
        plan_id: razorpayPlanId,
        total_count: totalCount,
        quantity: 1,
        customer_notify: 1,
      };

      if (customerDetails) {
        payload.notes = {
          email: customerDetails.email,
          name: customerDetails.name,
        };
      }

      return await this.razorpay.subscriptions.create(payload);
    } catch (error) {
      this.logger.error("Razorpay Subscription Creation Error:", error);
      throw new InternalServerErrorException(
        "Failed to create subscription on Razorpay",
      );
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = true) {
    try {
      return await this.razorpay.subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
      });
    } catch (error) {
      this.logger.error(
        `Razorpay Subscription Cancel Error for ${subscriptionId}:`,
        error,
      );
      throw new InternalServerErrorException("Failed to cancel subscription");
    }
  }

  async fetchSubscription(subscriptionId: string) {
    try {
      return await this.razorpay.subscriptions.fetch(subscriptionId);
    } catch (error) {
      this.logger.error(
        `Razorpay Subscription Fetch Error for ${subscriptionId}:`,
        error,
      );
      throw new InternalServerErrorException(
        "Failed to fetch subscription details from Razorpay",
      );
    }
  }

  verifySubscriptionSignature(
    subscriptionId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const secret = this.configService.get<string>("RAZORPAY_KEY_SECRET");
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(paymentId + "|" + subscriptionId)
      .digest("hex");

    return generatedSignature === signature;
  }
}
