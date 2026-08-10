import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { SubscriptionTier } from "./enums";

@Entity("subscription_plans")
export class SubscriptionPlan {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ enum: SubscriptionTier })
  @Column({
    type: "enum",
    enum: SubscriptionTier,
    unique: true,
  })
  name: SubscriptionTier;

  @ApiProperty()
  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @ApiProperty()
  @Column({ type: "jsonb", nullable: true })
  features: any;

  @ApiProperty({ required: false })
  @Column({ type: "text", nullable: true })
  description: string;

  @ApiProperty({ required: false })
  @Column({ type: "text", nullable: true })
  imageUrl: string;

  @ApiProperty()
  @Column({ default: false })
  isPopular: boolean;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ required: false })
  @Column({ type: "varchar", nullable: true })
  razorpayPlanId: string;

  @ApiProperty({ default: "monthly" })
  @Column({ type: "varchar", default: "monthly" })
  billingPeriod: string;
}
