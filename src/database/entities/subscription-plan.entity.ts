import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { SubscriptionTier } from './enums';

@Entity('subscription_plans')
export class SubscriptionPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: SubscriptionTier,
        unique: true,
    })
    name: SubscriptionTier;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'jsonb', nullable: true })
    features: any;
}
