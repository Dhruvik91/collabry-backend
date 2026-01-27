import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { InfluencerProfile } from './influencer-profile.entity';
import { VerificationStatus } from './enums';

@Entity('verification_requests')
export class VerificationRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => InfluencerProfile)
    influencerProfile: InfluencerProfile;

    @Column({
        type: 'enum',
        enum: VerificationStatus,
        default: VerificationStatus.PENDING,
    })
    status: VerificationStatus;

    @Column({ type: 'jsonb', nullable: true })
    documents: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
