import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";

@Entity("videos_for_sale")
export class VideoForSale {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: "influencerId" })
  influencer: User;

  @Column()
  influencerId: string;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty({ required: false })
  @Column({ type: "text", nullable: true })
  description: string;

  @ApiProperty()
  @Column({ type: "text" })
  videoUrl: string;

  @ApiProperty({ required: false })
  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  price: number;

  @ApiProperty({ type: [String], required: false })
  @Column({ type: "text", array: true, nullable: true })
  categories: string[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
