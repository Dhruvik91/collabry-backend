import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('push_subscriptions')
export class PushSubscription {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    @Index()
    userId: string;

    @ApiProperty()
    @Column('text')
    @Index({ unique: true })
    endpoint: string;

    @Column('text')
    p256dh: string;

    @Column('text')
    auth: string;

    @ApiProperty()
    @Column({ nullable: true })
    userAgent: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
