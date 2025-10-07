import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({ cors: true, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<number, string>(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: AuthenticatedSocket) {
    // Connexion silencieuse
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.userSocketMap.delete(client.userId);
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.userId = data.userId;
    this.userSocketMap.set(data.userId, client.id);
    return { success: true };
  }

  @SubscribeMessage('sendPrivateMessage')
  async handlePrivateMessage(
    @MessageBody() data: { recipientId: number; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const message = await this.chatService.sendPrivateMessage(
        client.userId,
        data.recipientId,
        data.content,
      );

      // Envoyer le message au destinataire s'il est connecté
      const recipientSocketId = this.userSocketMap.get(data.recipientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('newPrivateMessage', {
          id: message.id,
          content: message.content,
          senderId: client.userId,
          sender: message.sender,
          sentAt: message.sentAt,
        });
      }

      // Confirmer au sender
      return {
        success: true,
        message: {
          id: message.id,
          content: message.content,
          recipientId: data.recipientId,
          sentAt: message.sentAt,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { otherUserId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await this.chatService.markConversationAsRead(client.userId, data.otherUserId);

      // Notifier l'autre utilisateur que ses messages ont été lus
      const otherSocketId = this.userSocketMap.get(data.otherUserId);
      if (otherSocketId) {
        this.server.to(otherSocketId).emit('messagesRead', {
          userId: client.userId,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { recipientId: number; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const recipientSocketId = this.userSocketMap.get(data.recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('userTyping', {
        userId: client.userId,
        isTyping: data.isTyping,
      });
    }
  }
}
