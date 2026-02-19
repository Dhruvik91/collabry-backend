import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { User } from '../../database/entities/user.entity';
import { InfluencerController } from './influencer.controller';
import { InfluencerService } from './influencer.service';
import { RankingModule } from '../ranking/ranking.module';

@Module({
    imports: [TypeOrmModule.forFeature([InfluencerProfile, User]), RankingModule],
    controllers: [InfluencerController],
    providers: [InfluencerService],
    exports: [InfluencerService],
})
export class InfluencerModule { }
