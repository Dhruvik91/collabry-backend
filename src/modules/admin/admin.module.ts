import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ReportModule } from '../report/report.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { VerificationModule } from '../verification/verification.module';
import { User } from '../../database/entities/user.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { VerificationRequest } from '../../database/entities/verification-request.entity';
import { Review } from '../../database/entities/review.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Collaboration, VerificationRequest, Review]),
        ReportModule,
        SubscriptionModule,
        VerificationModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule { }
