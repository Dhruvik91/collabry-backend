import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionPlan } from "../../database/entities/subscription-plan.entity";
import { UserSubscription } from "../../database/entities/user-subscription.entity";
import { User } from "../../database/entities/user.entity";
import { PaymentModule } from "../payment/payment.module";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription, User]),
    PaymentModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
