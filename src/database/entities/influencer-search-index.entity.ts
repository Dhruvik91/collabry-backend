import {
    Entity,
    Column,
    PrimaryColumn,
    OneToOne,
    JoinColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('influencer_search_index')
export class InfluencerSearchIndex {
    @PrimaryColumn('uuid')
    influencerId: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'influencerId' })
    influencer: User;

    @Column({ type: 'tsvector', nullable: true })
    keywords: any;

    @UpdateDateColumn()
    updatedAt: Date;
}
