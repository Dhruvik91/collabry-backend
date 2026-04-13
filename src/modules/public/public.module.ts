import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { InfluencerModule } from '../influencer/influencer.module';
import { ProfileModule } from '../profile/profile.module';
import { ReviewModule } from '../review/review.module';
import { RankingModule } from '../ranking/ranking.module';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { Auction } from '../../database/entities/auction.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Auction]),
        InfluencerModule,
        ProfileModule,
        ReviewModule,
        RankingModule,
    ],
    controllers: [PublicController],
    providers: [PublicService],
    exports: [PublicService],
})
export class PublicModule { }
