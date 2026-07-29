import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { ReportModule } from "../report/report.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { VerificationModule } from "../verification/verification.module";
import { KCSettingModule } from "../kc-setting/kc-setting.module";
import { KcWalletModule } from "../kc-wallet/kc-wallet.module";
import { User } from "../../database/entities/user.entity";
import { Collaboration } from "../../database/entities/collaboration.entity";
import { VerificationRequest } from "../../database/entities/verification-request.entity";
import { Review } from "../../database/entities/review.entity";
import { Auction } from "../../database/entities/auction.entity";
import { Bid } from "../../database/entities/bid.entity";
import { Conversation } from "../../database/entities/conversation.entity";
import { Message } from "../../database/entities/message.entity";
import { PaymentOrder } from "../../database/entities/payment-order.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Collaboration,
      VerificationRequest,
      Review,
      Auction,
      Bid,
      Conversation,
      Message,
      PaymentOrder,
    ]),
    ReportModule,
    SubscriptionModule,
    VerificationModule,
    KCSettingModule,
    KcWalletModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
