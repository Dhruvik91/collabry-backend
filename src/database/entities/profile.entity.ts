import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @ApiProperty()
    @Column({ nullable: true })
    fullName: string;

    @ApiProperty()
    @Index()
    @Column({ unique: true, nullable: true })
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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
