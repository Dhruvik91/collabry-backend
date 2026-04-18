import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('referrals')
export class Referral {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @Index()
    referrer: User;

    @OneToOne(() => User)
    @JoinColumn()
    @Index()
    referred: User;

    @ApiProperty()
    @Column({ default: false })
    rewarded: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
