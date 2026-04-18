import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmConnectionModule } from './database/typeorm-root.module';
import { DatabaseModule } from './database/database.module';
import { AwsModule } from './modules/aws/aws.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UserAuthModule } from './modules/user-auth/user-auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { InfluencerModule } from './modules/influencer/influencer.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ReviewModule } from './modules/review/review.module';
import { ReportModule } from './modules/report/report.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { VerificationModule } from './modules/verification/verification.module';
import { AdminModule } from './modules/admin/admin.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { AuctionModule } from './modules/auction/auction.module';
import { SocketModule } from './modules/socket/socket.module';
import { PublicModule } from './modules/public/public.module';
import { KcWalletModule } from './modules/kc-wallet/kc-wallet.module';
import { KcTransactionModule } from './modules/kc-transaction/kc-transaction.module';
import { KCSettingModule } from './modules/kc-setting/kc-setting.module';
import { ReferralModule } from './modules/referral/referral.module';
import { RolesGuard } from './modules/auth/Guards/roles.guard';


@Module({
  imports: [
    TypeOrmConnectionModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    DatabaseModule,

    // Core modules
    UserAuthModule,
    ProfileModule,
    InfluencerModule,
    CollaborationModule,
    MessagingModule,
    ReviewModule,
    ReportModule,
    SubscriptionModule,
    VerificationModule,
    AdminModule,
    RankingModule,
    AuctionModule,
    SocketModule,
    PublicModule,
    KcWalletModule,
    KcTransactionModule,
    KCSettingModule,
    ReferralModule,

    // Utility modules

    AwsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
