import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { InfluencerProfile } from './influencer-profile.entity';
import { VerificationStatus } from './enums';

@Entity('verification_requests')
export class VerificationRequest {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ type: () => InfluencerProfile })
    @ManyToOne(() => InfluencerProfile)
    influencerProfile: InfluencerProfile;

    @ApiProperty({ enum: VerificationStatus })
    @Column({
        type: 'enum',
        enum: VerificationStatus,
        default: VerificationStatus.PENDING,
    })
    status: VerificationStatus;

    @ApiProperty()
    @Column({ type: 'jsonb', nullable: true })
    documents: any;

    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    adminNotes: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
