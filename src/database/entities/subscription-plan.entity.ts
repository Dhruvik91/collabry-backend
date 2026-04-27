import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionTier } from './enums';

@Entity('subscription_plans')
export class SubscriptionPlan {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ enum: SubscriptionTier })
    @Column({
        type: 'enum',
        enum: SubscriptionTier,
        unique: true,
    })
    name: SubscriptionTier;

    @ApiProperty()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @ApiProperty()
    @Column({ type: 'jsonb', nullable: true })
    features: any;
}
