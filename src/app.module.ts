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
