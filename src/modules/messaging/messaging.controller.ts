import { Controller, Get, Post, Body, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('v1/messaging')
export class MessagingController {
    constructor(private readonly messagingService: MessagingService) { }

    @Post('conversation')
    @ApiOperation({ summary: 'Create or retrieve a conversation' })
    @ApiCreatedResponse({ description: 'Conversation retrieved or created', type: Conversation })
    async getOrCreate(@Req() req: any, @Body() startDto: StartConversationDto) {
        return this.messagingService.getOrCreateConversation(req.user.id, startDto);
    }

    @Get('conversation')
    @ApiOperation({ summary: 'List all conversations for current user' })
    @ApiOkResponse({ description: 'Returns a list of conversations', type: Conversation, isArray: true })
    async findMyConversations(@Req() req: any) {
        return this.messagingService.getMyConversations(req.user.id);
    }

    @Post('conversation/:conversationId/message')
    @ApiOperation({ summary: 'Send a message in a conversation' })
    @ApiCreatedResponse({ description: 'Message sent successfully', type: Message })
    async sendMessage(
        @Req() req: any,
        @Param('conversationId') conversationId: string,
        @Body() sendDto: SendMessageDto,
    ) {
        return this.messagingService.sendMessage(conversationId, req.user.id, sendDto);
    }

    @Get('conversation/:conversationId/messages')
    @ApiOperation({ summary: 'Get message history for a conversation' })
    @ApiOkResponse({ description: 'Returns a list of messages', type: Message, isArray: true })
    async getMessages(@Req() req: any, @Param('conversationId') conversationId: string) {
        return this.messagingService.getMessageHistory(conversationId, req.user.id);
    }
}
