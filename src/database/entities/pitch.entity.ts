import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { PitchStatus } from './enums';

@Entity('pitches')
export class Pitch {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ type: () => User })
    @Index()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'influencerId' })
    influencer: User;

    @ApiProperty({ type: () => User })
    @Index()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'targetId' })
    target: User;

    @ApiProperty()
    @Column({ type: 'text' })
    message: string;

    @ApiProperty({ enum: PitchStatus })
    @Index()
    @Column({
        type: 'enum',
        enum: PitchStatus,
        default: PitchStatus.PENDING,
    })
    status: PitchStatus;

    @ApiProperty({ required: false })
    @Column({ type: 'text', nullable: true })
    workUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
