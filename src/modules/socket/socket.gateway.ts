import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SocketGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      let token = client.handshake.auth?.token;

      // 1. Try to get from Authorization header
      if (!token) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader) {
          token = authHeader.split(' ')[1] || authHeader;
        }
      }

      // 2. Try to get from Cookie
      if (!token) {
        const cookieHeader = client.handshake.headers.cookie;
        if (cookieHeader) {
          const cookies = cookieHeader.split(';').reduce((acc, curr) => {
            const [key, value] = curr.split('=');
            acc[key.trim()] = value;
            return acc;
          }, {});
          token = cookies['access_token'];
        }
      }

      if (!token) {
        this.logger.warn(`Connection attempt without token: ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET_KEY'),
      });

      client.data.user = payload;
      
      // Join self-room for personal notifications
      client.join(`user_${payload.id}`);
      this.logger.log(`Client connected: ${client.id} (User: ${payload.id})`);
    } catch (e) {
      this.logger.error(`Connection authentication failed: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    client.join(`conversation_${conversationId}`);
    return { event: 'joined_conversation', data: conversationId };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    client.leave(`conversation_${conversationId}`);
    return { event: 'left_conversation', data: conversationId };
  }

  @SubscribeMessage('join_auction')
  handleJoinAuction(@ConnectedSocket() client: Socket, @MessageBody() auctionId: string) {
    client.join(`auction_${auctionId}`);
    return { event: 'joined_auction', data: auctionId };
  }

  @SubscribeMessage('leave_auction')
  handleLeaveAuction(@ConnectedSocket() client: Socket, @MessageBody() auctionId: string) {
    client.leave(`auction_${auctionId}`);
    return { event: 'left_auction', data: auctionId };
  }

  // Helper methods to emit events from services
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation_${conversationId}`).emit(event, data);
  }

  emitToAuction(auctionId: string, event: string, data: any) {
    this.server.to(`auction_${auctionId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
