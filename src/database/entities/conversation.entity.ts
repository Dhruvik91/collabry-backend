import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations')
@Unique(['userOne', 'userTwo']) // Enforce unique conversation between two users
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    userOne: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    userTwo: User;

    @Column({ nullable: true })
    lastMessageAt: Date;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
