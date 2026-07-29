import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";

@Entity("wallets")
export class Wallet {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  balance: number;

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn()
  @Index()
  user: User;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
