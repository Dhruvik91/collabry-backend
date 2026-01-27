import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('auth_sessions')
export class AuthSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @Column({ length: 45, nullable: true })
    ipAddress: string;

    @Column({ type: 'text', nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    lastActiveAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
