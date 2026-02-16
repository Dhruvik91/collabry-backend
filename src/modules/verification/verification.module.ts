import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationRequest } from '../../database/entities/verification-request.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { MailerConfigModule } from '../mailer/mailer.module';
import { RankingModule } from '../ranking/ranking.module';

@Module({
    imports: [TypeOrmModule.forFeature([VerificationRequest, InfluencerProfile]), MailerConfigModule, RankingModule],
    controllers: [VerificationController],
    providers: [VerificationService],
    exports: [VerificationService],
})
export class VerificationModule { }
