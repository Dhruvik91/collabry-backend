import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { AvailabilityStatus, CollaborationType } from './enums';
import { Collaboration } from './collaboration.entity';

@Entity('influencer_profiles')
export class InfluencerProfile {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.influencerProfile, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @ApiProperty()
    @Index()
    @Column({ nullable: true })
    niche: string;

    @ApiProperty()
    @Column({ type: 'jsonb', nullable: true })
    platforms: any;

    @ApiProperty()
    @Column({ type: 'bigint', default: 0 })
    followersCount: number;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    engagementRate: number;

    @ApiProperty()
    @Column({ type: 'text', array: true, nullable: true })
    collaborationTypes: string[];

    @ApiProperty({ enum: AvailabilityStatus })
    @Index()
    @Column({
        type: 'enum',
        enum: AvailabilityStatus,
        default: AvailabilityStatus.OPEN,
    })
    availability: AvailabilityStatus;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
    avgRating: number;

    @ApiProperty()
    @Column({ default: 0 })
    totalReviews: number;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    rankingScore: number;

    @ApiProperty()
    @Index()
    @Column({ default: false })
    verified: boolean;

    @ApiProperty({ description: 'The tier of the influencer ranking' })
    @Index()
    @Column({ nullable: true })
    rankingTier: string;

    @OneToMany(() => Collaboration, (collaboration) => collaboration.influencer)
    collaborations: Collaboration[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
