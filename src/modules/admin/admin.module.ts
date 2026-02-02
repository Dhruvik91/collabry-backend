import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ReportModule } from '../report/report.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
    imports: [ReportModule, SubscriptionModule, VerificationModule],
    controllers: [AdminController],
})
export class AdminModule { }
