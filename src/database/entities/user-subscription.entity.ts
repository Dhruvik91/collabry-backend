import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { SubscriptionPlan } from "./subscription-plan.entity";

export enum UserSubscriptionStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  HALTED = "HALTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

@Entity("user_subscriptions")
export class UserSubscription {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @ApiProperty()
  @Column()
  userId: string;

  @ApiProperty()
  @Column()
  planId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: "planId" })
  plan: SubscriptionPlan;

  @ApiProperty({ required: false })
  @Index({ unique: true })
  @Column({ type: "varchar", nullable: true })
  razorpaySubscriptionId: string;

  @ApiProperty({ enum: UserSubscriptionStatus })
  @Column({
    type: "enum",
    enum: UserSubscriptionStatus,
    default: UserSubscriptionStatus.PENDING,
  })
  status: UserSubscriptionStatus;

  @ApiProperty({ required: false })
  @Column({ type: "timestamp", nullable: true })
  currentPeriodStart: Date;

  @ApiProperty({ required: false })
  @Column({ type: "timestamp", nullable: true })
  currentPeriodEnd: Date;

  @ApiProperty({ required: false })
  @Column({ type: "timestamp", nullable: true })
  cancelledAt: Date;

  @ApiProperty({ required: false })
  @Column({ type: "jsonb", nullable: true })
  metadata: any;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
