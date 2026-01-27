import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CollaborationStatus } from './enums';
import { Review } from './review.entity';

@Entity('collaborations')
export class Collaboration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'requesterId' })
    requester: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'influencerId' })
    influencer: User;

    @Column({ nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: CollaborationStatus,
        default: CollaborationStatus.REQUESTED,
    })
    status: CollaborationStatus;

    @Column({ type: 'jsonb', nullable: true })
    proposedTerms: any;

    @Column({ type: 'jsonb', nullable: true })
    agreedTerms: any;

    @Column({ type: 'date', nullable: true })
    startDate: Date;

    @Column({ type: 'date', nullable: true })
    endDate: Date;

    @OneToOne(() => Review, (review) => review.collaboration)
    review: Review;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
