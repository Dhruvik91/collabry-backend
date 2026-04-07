import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { AuctionStatus, CollaborationType } from './enums';
import { Bid } from './bid.entity';

@Entity('auctions')
export class Auction {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Column()
    title: string;

    @ApiProperty()
    @Column({ type: 'text' })
    description: string;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    minBudget: number;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    maxBudget: number;

    @ApiProperty()
    @Column({ type: 'timestamp' })
    deadline: Date;

    @ApiProperty({ enum: AuctionStatus })
    @Index()
    @Column({
        type: 'enum',
        enum: AuctionStatus,
        default: AuctionStatus.OPEN,
    })
    status: AuctionStatus;

    @ApiProperty({ enum: CollaborationType })
    @Column({
        type: 'enum',
        enum: CollaborationType,
        nullable: true,
    })
    category: CollaborationType;

    @Index()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'creatorId' })
    creator: User;

    @OneToMany(() => Bid, (bid) => (bid as any).auction)
    bids: Bid[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
