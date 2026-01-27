import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ReportStatus } from './enums';

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    reporter: User;

    @ManyToOne(() => User)
    targetUser: User;

    @Column({ nullable: true })
    reason: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.OPEN,
    })
    status: ReportStatus;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    resolvedAt: Date;
}
