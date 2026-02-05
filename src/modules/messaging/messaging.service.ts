import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { isUniqueConstraintError } from '../../database/errors/unique-constraint.type-guard';

@Injectable()
export class MessagingService {
    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
    ) { }

    async getOrCreateConversation(userId: string, startDto: StartConversationDto): Promise<Conversation> {
        const { recipientId } = startDto;

        // Ensure userOne ID < userTwo ID for consistent storage
        const [userOneId, userTwoId] = [userId, recipientId].sort();

        let conversation = await this.conversationRepo.findOne({
            where: {
                userOne: { id: userOneId },
                userTwo: { id: userTwoId },
            },
            relations: ['userOne', 'userTwo', 'userOne.profile', 'userTwo.profile'],
        });

        if (!conversation) {
            try {
                conversation = this.conversationRepo.create({
                    userOne: { id: userOneId } as any,
                    userTwo: { id: userTwoId } as any,
                });
                conversation = await this.conversationRepo.save(conversation);
            } catch (error) {
                if (isUniqueConstraintError(error)) {
                    // Conversation was likely created by a concurrent request, fetch it
                    conversation = await this.conversationRepo.findOne({
                        where: {
                            userOne: { id: userOneId },
                            userTwo: { id: userTwoId },
                        },
                        relations: ['userOne', 'userTwo', 'userOne.profile', 'userTwo.profile'],
                    });
                } else {
                    throw error;
                }
            }

            // If we just created it and saved was successful, or if we caught unique constraint and fetched it
            if (conversation && !conversation.userOne?.profile) {
                // Reload to get relations if they weren't fetched yet
                conversation = await this.conversationRepo.findOne({
                    where: { id: conversation.id },
                    relations: ['userOne', 'userTwo', 'userOne.profile', 'userTwo.profile'],
                });
            }
        }

        return conversation;
    }

    async getMyConversations(userId: string): Promise<Conversation[]> {
        return await this.conversationRepo.find({
            where: [
                { userOne: { id: userId } },
                { userTwo: { id: userId } },
            ],
            relations: ['userOne', 'userTwo', 'userOne.profile', 'userTwo.profile'],
            order: { lastMessageAt: 'DESC' },
        });
    }

    async sendMessage(conversationId: string, userId: string, sendDto: SendMessageDto): Promise<Message> {
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId },
            relations: ['userOne', 'userTwo'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.userOne.id !== userId && conversation.userTwo.id !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        const message = this.messageRepo.create({
            conversation: { id: conversationId } as any,
            sender: { id: userId } as any,
            message: sendDto.message,
        });

        const savedMessage = await this.messageRepo.save(message);

        // Update lastMessageAt in conversation
        conversation.lastMessageAt = new Date();
        await this.conversationRepo.save(conversation);

        return savedMessage;
    }

    async getMessageHistory(conversationId: string, userId: string): Promise<Message[]> {
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId },
            relations: ['userOne', 'userTwo'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.userOne.id !== userId && conversation.userTwo.id !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        return await this.messageRepo.find({
            where: { conversation: { id: conversationId } },
            order: { createdAt: 'ASC' },
            relations: ['sender', 'sender.profile'],
        });
    }

    async updateMessage(messageId: string, userId: string, updateDto: SendMessageDto): Promise<Message> {
        const message = await this.messageRepo.findOne({
            where: { id: messageId },
            relations: ['sender'],
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.sender.id !== userId) {
            throw new ForbiddenException('You can only update your own messages');
        }

        message.message = updateDto.message;
        message.updatedAt = new Date();
        return await this.messageRepo.save(message);
    }

    async deleteMessage(messageId: string, userId: string): Promise<void> {
        const message = await this.messageRepo.findOne({
            where: { id: messageId },
            relations: ['sender'],
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.sender.id !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        await this.messageRepo.remove(message);
    }

    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId },
            relations: ['userOne', 'userTwo'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.userOne.id !== userId && conversation.userTwo.id !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        // Delete all messages in the conversation first (TypeORM might handle this if cascade is set, but let's be explicit if not sure)
        await this.messageRepo.delete({ conversation: { id: conversationId } });
        await this.conversationRepo.remove(conversation);
    }
}
