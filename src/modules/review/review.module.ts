import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../../database/entities/review.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
    imports: [TypeOrmModule.forFeature([Review, Collaboration, InfluencerProfile])],
    controllers: [ReviewController],
    providers: [ReviewService],
    exports: [ReviewService],
})
export class ReviewModule { }
