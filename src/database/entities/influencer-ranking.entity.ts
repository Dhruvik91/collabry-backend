import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity('influencer_rankings')
export class InfluencerRanking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    influencer: User;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    score: number;

    @Column({ type: 'int', nullable: true })
    rankPosition: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    calculatedAt: Date;
}
