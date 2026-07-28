import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Collaboration } from "./collaboration.entity";
import { User } from "./user.entity";
import { InfluencerProfile } from "./influencer-profile.entity";
import { ReviewStatus } from "./enums";

@Entity("reviews")
export class Review {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @Index()
  @ManyToOne(() => User)
  reviewer: User;

  @ApiProperty({ type: () => InfluencerProfile })
  @Index()
  @ManyToOne(() => InfluencerProfile)
  @JoinColumn({ name: "influencerId" })
  influencer: InfluencerProfile;

  @ApiProperty({ type: () => Collaboration })
  @OneToOne(() => Collaboration, (collaboration) => collaboration.review)
  @JoinColumn()
  collaboration: Collaboration;

  @ApiProperty()
  @Column({ type: "int" })
  rating: number;

  @ApiProperty()
  @Column({ type: "text", nullable: true })
  comment: string;

  @ApiProperty({ enum: ReviewStatus })
  @Index()
  @Column({
    type: "enum",
    enum: ReviewStatus,
    default: ReviewStatus.VISIBLE,
  })
  status: ReviewStatus;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
