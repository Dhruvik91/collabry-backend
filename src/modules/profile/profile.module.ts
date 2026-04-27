import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../../database/entities/profile.entity';
import { User } from '../../database/entities/user.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { Auction } from '../../database/entities/auction.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
    imports: [TypeOrmModule.forFeature([Profile, User, InfluencerProfile, Auction, Collaboration])],
    controllers: [ProfileController],
    providers: [ProfileService],
    exports: [ProfileService],
})
export class ProfileModule { }
