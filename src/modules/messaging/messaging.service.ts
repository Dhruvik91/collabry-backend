import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { isUniqueConstraintError } from '../../database/errors/unique-constraint.type-guard';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class MessagingService {
    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
        private readonly socketGateway: SocketGateway,
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
            relations: ['userOne', 'userTwo', 'userOne.profile', 'userTwo.profile', 'userOne.influencerProfile', 'userTwo.influencerProfile'],
        });

        if (!conversation) {
            let isNew = false;
            try {
                conversation = this.conversationRepo.create({
                    userOne: { id: userOneId } as any,
                    userTwo: { id: userTwoId } as any,
                });
                conversation = await this.conversationRepo.save(conversation);
                isNew = true;
            } catch (error) {
                if (isUniqueConstraintError(error)) {
                    // Conversation was likely created by a concurrent request, fetch it
                    conversation = await this.conversationRepo.findOne({
                        where: {
                            userOne: { id: userOneId },
                            userTwo: { id: userTwoId },
                        },
                        relations: ['userOne', 'userTwo', 'userOne.profile', 'userTwo.profile', 'userOne.influencerProfile', 'userTwo.influencerProfile'],
                    });
                } else {
                    throw error;
                }
            }

            // Reload to get relations if they weren't fetched yet
            if (conversation) {
                conversation = await this.conversationRepo.findOne({
                    where: { id: conversation.id },
                    relations: ['userOne', 'userTwo', 'userOne.profile', 'userTwo.profile', 'userOne.influencerProfile', 'userTwo.influencerProfile'],
                });

                // Emit new conversation event to both users if it's actually new
                if (isNew && conversation) {
                    this.socketGateway.emitToUser(userOneId, 'new_conversation', conversation);
                    this.socketGateway.emitToUser(userTwoId, 'new_conversation', conversation);
                }
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
            relations: ['userOne', 'userTwo', 'userOne.profile', 'userTwo.profile', 'userOne.influencerProfile', 'userTwo.influencerProfile'],
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

        // Reload message with relations for the WebSocket event
        const fullMessage = await this.messageRepo.findOne({
            where: { id: savedMessage.id },
            relations: ['sender', 'sender.profile', 'sender.influencerProfile'],
        });

        // Update lastMessageAt in conversation
        conversation.lastMessageAt = new Date();
        await this.conversationRepo.save(conversation);

        // Emit new message event to the room (for the active chat window)
        this.socketGateway.emitToConversation(conversationId, 'new_message', fullMessage || savedMessage);
        
        // Also emit to both users' private rooms (for sidebar/list updates)
        this.socketGateway.emitToUser(conversation.userOne.id, 'new_message', fullMessage || savedMessage);
        this.socketGateway.emitToUser(conversation.userTwo.id, 'new_message', fullMessage || savedMessage);
        
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
            relations: ['sender', 'sender.profile', 'sender.influencerProfile'],
        });
    }

    async updateMessage(messageId: string, userId: string, updateDto: SendMessageDto): Promise<Message> {
        const message = await this.messageRepo.findOne({
            where: { id: messageId },
            relations: ['sender', 'conversation'],
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.sender.id !== userId) {
            throw new ForbiddenException('You can only update your own messages');
        }

        message.message = updateDto.message;
        message.updatedAt = new Date();
        const savedMessage = await this.messageRepo.save(message);
        
        // Reload for WebSocket
        const fullMessage = await this.messageRepo.findOne({
            where: { id: savedMessage.id },
            relations: ['sender', 'sender.profile', 'sender.influencerProfile'],
        });

        // Emit updated message event
        this.socketGateway.emitToConversation(message.conversation?.id || '', 'message_updated', fullMessage || savedMessage);
        
        return savedMessage;
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

        const conversationId = message.conversation?.id;
        await this.messageRepo.remove(message);
        
        // Emit deleted message event
        if (conversationId) {
            this.socketGateway.emitToConversation(conversationId, 'message_deleted', { messageId, conversationId });
        }
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

        // Emit conversation deleted event
        this.socketGateway.emitToConversation(conversationId, 'conversation_deleted', { conversationId });
    }
}
