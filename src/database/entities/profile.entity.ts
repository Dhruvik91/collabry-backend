import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ type: () => User })
    @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @ApiProperty()
    @Column({ nullable: true })
    fullName: string;

    @ApiProperty()
    @Index({ unique: true, where: '"deletedAt" IS NULL' })
    @Column({ nullable: true })
    username: string;

    @ApiProperty()
    @Column({ nullable: true, type: 'text' })
    avatarUrl: string;

    @ApiProperty()
    @Column({ nullable: true, type: 'text' })
    bio: string;

    @ApiProperty()
    @Column({ nullable: true })
    location: string;

    @ApiProperty()
    @Column({ type: 'jsonb', nullable: true })
    socialLinks: any;

    @ApiProperty()
    @Column({ default: false })
    verified: boolean;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
