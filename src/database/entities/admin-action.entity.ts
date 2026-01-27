import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('admin_actions')
export class AdminAction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    admin: User;

    @Column({ length: 100, nullable: true })
    actionType: string;

    @Column({ length: 100, nullable: true })
    targetType: string;

    @Column({ type: 'uuid', nullable: true })
    targetId: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn()
    createdAt: Date;
}
