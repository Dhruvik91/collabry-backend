import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Auction } from './auction.entity';
import { BidStatus } from './enums';

@Entity('bids')
export class Bid {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => Auction, (auction) => auction.bids, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auctionId' })
    auction: Auction;

    @Index()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'influencerId' })
    influencer: User;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ApiProperty()
    @Column({ type: 'text' })
    proposal: string;

    @ApiProperty({ enum: BidStatus })
    @Index()
    @Column({
        type: 'enum',
        enum: BidStatus,
        default: BidStatus.PENDING,
    })
    status: BidStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
