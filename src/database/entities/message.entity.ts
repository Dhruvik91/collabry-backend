import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { Conversation } from "./conversation.entity";

@Entity("messages")
export class Message {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => Conversation })
  @Index()
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: "CASCADE",
  })
  conversation: Conversation;

  @ApiProperty({ type: () => User })
  @Index()
  @ManyToOne(() => User)
  sender: User;

  @ApiProperty()
  @Column({ type: "text" })
  message: string;

  @ApiProperty()
  @Column({ nullable: true })
  readAt: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
