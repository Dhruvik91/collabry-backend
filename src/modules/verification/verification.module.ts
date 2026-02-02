import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationRequest } from '../../database/entities/verification-request.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
    imports: [TypeOrmModule.forFeature([VerificationRequest, InfluencerProfile])],
    controllers: [VerificationController],
    providers: [VerificationService],
    exports: [VerificationService],
})
export class VerificationModule { }
