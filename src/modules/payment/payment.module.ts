import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentOrder } from "../../database/entities/payment-order.entity";
import { TopUpPlan } from "../../database/entities/top-up-plan.entity";
import { PaymentService } from "./payment.service";
import { RazorpayService } from "./razorpay.service";
import { PaymentCleanupService } from "./payment-cleanup.service";
import { PaymentController } from "./payment.controller";
import { KcWalletModule } from "../kc-wallet/kc-wallet.module";
import { MailerConfigModule } from "../mailer/mailer.module";
import { User } from "../../database/entities/user.entity";
import { UserSubscription } from "../../database/entities/user-subscription.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentOrder, TopUpPlan, User, UserSubscription]),
    KcWalletModule,
    MailerConfigModule,
  ],
  providers: [PaymentService, RazorpayService, PaymentCleanupService],
  controllers: [PaymentController],
  exports: [PaymentService, RazorpayService],
})
export class PaymentModule {}
