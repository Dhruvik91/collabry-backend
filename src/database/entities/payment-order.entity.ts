import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { TopUpPlan } from "./top-up-plan.entity";
import { PaymentStatus } from "./enums";

@Entity("payment_orders")
export class PaymentOrder {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  @Index()
  user: User;

  @ManyToOne(() => TopUpPlan)
  @Index()
  plan: TopUpPlan;

  @ApiProperty()
  @Column({ unique: true })
  @Index()
  razorpayOrderId: string;

  @ApiProperty()
  @Column({ nullable: true, unique: true })
  razorpayPaymentId: string;

  @ApiProperty()
  @Column({ nullable: true })
  razorpaySignature: string;

  @ApiProperty({ enum: PaymentStatus })
  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty()
  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @ApiProperty()
  @Column({ type: "varchar", length: 10, default: "INR" })
  currency: string;

  @ApiProperty()
  @Column({ type: "int" })
  coins: number;

  @ApiProperty()
  @Column({ type: "jsonb", nullable: true })
  metadata: any;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
