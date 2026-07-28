import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { ReportStatus } from "./enums";

@Entity("reports")
export class Report {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  reporter: User;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  targetUser: User;

  @ApiProperty()
  @Column({ nullable: true })
  targetType: string;

  @ApiProperty()
  @Column({ nullable: true })
  reason: string;

  @ApiProperty()
  @Column({ type: "text", nullable: true })
  description: string;

  @ApiProperty({ enum: ReportStatus })
  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.OPEN,
  })
  status: ReportStatus;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @Column({ nullable: true })
  resolvedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
