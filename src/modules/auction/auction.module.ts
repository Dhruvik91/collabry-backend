import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '../../database/entities/auction.entity';
import { Bid } from '../../database/entities/bid.entity';
import { User } from '../../database/entities/user.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { AuctionController } from './auction.controller';
import { AuctionService } from './auction.service';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Auction, Bid, User, Collaboration]),
        CollaborationModule,
    ],
    controllers: [AuctionController],
    providers: [AuctionService],
    exports: [AuctionService],
})
export class AuctionModule {}
