import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
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
    @Column({ nullable: true })
    fullName: string;

    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    avatarUrl: string;

    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    bio: string;

    @ApiProperty()
    @Column({ nullable: true })
    address: string;

    @ApiProperty({ description: 'Platform data with handle, followers, and engagementRate per platform' })
    @Column({ type: 'jsonb', nullable: true })
    platforms: any;

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
    @Column({ type: 'text', array: true, nullable: true })
    categories: string[];

    @ApiProperty()
    @Column({ nullable: true })
    locationCountry: string;

    @ApiProperty()
    @Column({ nullable: true })
    locationCity: string;

    @ApiProperty()
    @Column({ nullable: true })
    gender: string;

    @ApiProperty()
    @Column({ type: 'text', array: true, nullable: true })
    languages: string[];

    @ApiProperty({ description: 'Total followers across all platforms' })
    @Index()
    @Column({ type: 'int', default: 0 })
    totalFollowers: number;

    @ApiProperty({ description: 'Average engagement rate across platforms' })
    @Index()
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    avgEngagementRate: number;

    @ApiProperty({ description: 'Audience gender ratio, e.g., { male: 0.4, female: 0.6 }' })
    @Column({ type: 'jsonb', nullable: true })
    audienceGenderRatio: any;

    @ApiProperty({ description: 'Audience age brackets, e.g., { "18-24": 0.3, "25-34": 0.5 }' })
    @Column({ type: 'jsonb', nullable: true })
    audienceAgeBrackets: any;

    @ApiProperty()
    @Column({ type: 'text', array: true, nullable: true })
    audienceTopCountries: string[];

    @ApiProperty()
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    minPrice: number;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    maxPrice: number;

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

    @DeleteDateColumn()
    deletedAt: Date;
}
