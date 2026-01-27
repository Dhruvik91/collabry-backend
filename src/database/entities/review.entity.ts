import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Collaboration } from './collaboration.entity';
import { User } from './user.entity';
import { ReviewStatus } from './enums';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    reviewer: User;

    @ManyToOne(() => User)
    influencer: User;

    @OneToOne(() => Collaboration, (collaboration) => collaboration.review)
    @JoinColumn()
    collaboration: Collaboration;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

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
