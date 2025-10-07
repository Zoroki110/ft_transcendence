import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, MessageType } from '../entities/chat-message.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async sendPrivateMessage(
    senderId: number,
    recipientId: number,
    content: string,
  ): Promise<ChatMessage> {
    const [sender, recipient] = await Promise.all([
      this.userRepo.findOne({ where: { id: senderId } }),
      this.userRepo.findOne({ where: { id: recipientId } }),
    ]);

    if (!sender) throw new NotFoundException('Sender not found');
    if (!recipient) throw new NotFoundException('Recipient not found');

    const message = this.messageRepo.create({
      content,
      senderId,
      sender,
      recipientId,
      recipient,
      type: MessageType.PRIVATE,
      isRead: false,
    });

    return await this.messageRepo.save(message);
  }

  async getConversation(userId: number, otherUserId: number): Promise<ChatMessage[]> {
    return await this.messageRepo.find({
      where: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
      relations: ['sender', 'recipient'],
      order: { sentAt: 'ASC' },
      take: 100,
    });
  }

  async getConversations(userId: number): Promise<any[]> {
    // Récupérer tous les messages privés impliquant cet utilisateur
    const messages = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .where('message.senderId = :userId OR message.recipientId = :userId', { userId })
      .andWhere('message.type = :type', { type: MessageType.PRIVATE })
      .orderBy('message.sentAt', 'DESC')
      .getMany();

    // Grouper par conversation (l'autre utilisateur)
    const conversationsMap = new Map();

    for (const message of messages) {
      const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;

      if (!conversationsMap.has(otherUserId)) {
        const otherUser = message.senderId === userId ? message.recipient : message.sender;
        const unreadCount = await this.getUnreadCount(userId, otherUserId);

        conversationsMap.set(otherUserId, {
          user: {
            id: otherUser.id,
            username: otherUser.username,
            avatar: otherUser.avatar,
            isOnline: otherUser.isOnline,
          },
          lastMessage: {
            content: message.content,
            sentAt: message.sentAt,
            senderId: message.senderId,
          },
          unreadCount,
        });
      }
    }

    return Array.from(conversationsMap.values());
  }

  async getUnreadCount(userId: number, fromUserId: number): Promise<number> {
    return await this.messageRepo.count({
      where: {
        recipientId: userId,
        senderId: fromUserId,
        isRead: false,
        type: MessageType.PRIVATE,
      },
    });
  }

  async markAsRead(messageIds: number[]): Promise<void> {
    await this.messageRepo.update(messageIds, { isRead: true });
  }

  async markConversationAsRead(userId: number, otherUserId: number): Promise<void> {
    await this.messageRepo
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where('recipientId = :userId', { userId })
      .andWhere('senderId = :otherUserId', { otherUserId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();
  }
}
