import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { AvailabilityStatus, CollaborationType } from './enums';
import { Collaboration } from './collaboration.entity';

@Entity('influencer_profiles')
export class InfluencerProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.influencerProfile, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column({ nullable: true })
    niche: string;

    @Column({ type: 'jsonb', nullable: true })
    platforms: any;

    @Column({ type: 'bigint', default: 0 })
    followersCount: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    engagementRate: number;

    @Column({ type: 'text', array: true, nullable: true })
    collaborationTypes: string[];

    @Column({
        type: 'enum',
        enum: AvailabilityStatus,
        default: AvailabilityStatus.OPEN,
    })
    availability: AvailabilityStatus;

    @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
    avgRating: number;

    @Column({ default: 0 })
    totalReviews: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    rankingScore: number;

    @Column({ default: false })
    verified: boolean;

    @OneToMany(() => Collaboration, (collaboration) => collaboration.influencer)
    collaborations: Collaboration[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
