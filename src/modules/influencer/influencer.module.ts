import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { InfluencerController } from './influencer.controller';
import { InfluencerService } from './influencer.service';

@Module({
    imports: [TypeOrmModule.forFeature([InfluencerProfile])],
    controllers: [InfluencerController],
    providers: [InfluencerService],
    exports: [InfluencerService],
})
export class InfluencerModule { }
