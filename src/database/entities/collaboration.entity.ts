import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { InfluencerProfile } from './influencer-profile.entity';
import { CollaborationStatus } from './enums';
import { Review } from './review.entity';

@Entity('collaborations')
export class Collaboration {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'requesterId' })
    requester: User;

    @Index()
    @ManyToOne(() => InfluencerProfile)
    @JoinColumn({ name: 'influencerId' })
    influencer: InfluencerProfile;

    @ApiProperty()
    @Column({ nullable: true })
    title: string;

    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    description: string;

    @ApiProperty({ enum: CollaborationStatus })
    @Index()
    @Column({
        type: 'enum',
        enum: CollaborationStatus,
        default: CollaborationStatus.REQUESTED,
    })
    status: CollaborationStatus;

    @ApiProperty()
    @Column({ type: 'jsonb', nullable: true })
    proposedTerms: any;

    @ApiProperty()
    @Column({ type: 'jsonb', nullable: true })
    agreedTerms: any;

    @ApiProperty()
    @Column({ type: 'date', nullable: true })
    startDate: Date;

    @ApiProperty()
    @Column({ type: 'date', nullable: true })
    endDate: Date;

    @OneToOne(() => Review, (review) => review.collaboration)
    review: Review;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ApiProperty({ description: 'Proof of completion URLs', type: [String], required: false })
    @Column({ type: 'text', array: true, nullable: true })
    proofUrls: string[];

    @ApiProperty({ description: 'Timestamp when proof was submitted', required: false })
    @Column({ type: 'timestamp', nullable: true })
    proofSubmittedAt: Date;

    @ApiProperty({ description: 'Timestamp when proof was verified', required: false })
    @Column({ type: 'timestamp', nullable: true })
    proofVerifiedAt: Date;

    @ApiProperty({ description: 'Admin who verified the proof', required: false })
    @Column({ type: 'uuid', nullable: true })
    proofVerifiedBy: string;
}
