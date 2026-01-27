import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('password_resets')
export class PasswordReset {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @Column({ unique: true })
    token: string;

    @Column()
    expiresAt: Date;

    @Column({ default: false })
    used: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
