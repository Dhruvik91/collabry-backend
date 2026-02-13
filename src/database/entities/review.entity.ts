import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Collaboration } from './collaboration.entity';
import { User } from './user.entity';
import { InfluencerProfile } from './influencer-profile.entity';
import { ReviewStatus } from './enums';

@Entity('reviews')
export class Review {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => User)
    reviewer: User;

    @Index()
    @ManyToOne(() => InfluencerProfile)
    @JoinColumn({ name: 'influencerId' })
    influencer: InfluencerProfile;

    @ApiProperty()
    @OneToOne(() => Collaboration, (collaboration) => collaboration.review)
    @JoinColumn()
    collaboration: Collaboration;

    @ApiProperty()
    @Column({ type: 'int' })
    rating: number;

    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    comment: string;

    @ApiProperty({ enum: ReviewStatus })
    @Index()
    @Column({
        type: 'enum',
        enum: ReviewStatus,
        default: ReviewStatus.VISIBLE,
    })
    status: ReviewStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
