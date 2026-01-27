import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column({ nullable: true })
    fullName: string;

    @Column({ unique: true, nullable: true })
    username: string;

    @Column({ nullable: true, type: 'text' })
    avatarUrl: string;

    @Column({ nullable: true, type: 'text' })
    bio: string;

    @Column({ nullable: true })
    location: string;

    @Column({ type: 'jsonb', nullable: true })
    socialLinks: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
