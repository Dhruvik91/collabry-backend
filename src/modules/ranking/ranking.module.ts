import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { Review } from '../../database/entities/review.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([InfluencerProfile, Collaboration, Review]),
    ],
    controllers: [RankingController],
    providers: [RankingService],
    exports: [RankingService],
})
export class RankingModule { }
