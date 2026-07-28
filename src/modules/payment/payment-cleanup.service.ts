import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { PaymentOrder } from "../../database/entities/payment-order.entity";
import { PaymentStatus } from "../../database/entities/enums";

@Injectable()
export class PaymentCleanupService {
  private readonly logger = new Logger(PaymentCleanupService.name);

  constructor(
    @InjectRepository(PaymentOrder)
    private readonly orderRepo: Repository<PaymentOrder>,
  ) {}

  /**
   * Automatically cancel abandoned PENDING orders older than 24 hours.
   * Logic: Runs every hour.
   * Robustness: This keeps the database lean and ensures order history is accurate.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAbandonedOrders() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const abandonedOrders = await this.orderRepo.find({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: LessThan(twentyFourHoursAgo),
      },
    });

    if (abandonedOrders.length === 0) return;

    this.logger.log(
      `Found ${abandonedOrders.length} abandoned PENDING orders to clean up.`,
    );

    for (const order of abandonedOrders) {
      order.status = PaymentStatus.CANCELLED;
      order.metadata = {
        ...(order.metadata || {}),
        cleanup_reason: "auto_cancelled_after_24h_stale",
      };
    }

    await this.orderRepo.save(abandonedOrders);
    this.logger.log(
      `Successfully auto-cancelled ${abandonedOrders.length} stale orders.`,
    );
  }
}
