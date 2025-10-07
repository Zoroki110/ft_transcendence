import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendPrivateMessageDto } from './dto/send-private-message.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Send a private message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendPrivateMessage(@Body() dto: SendPrivateMessageDto, @Req() req) {
    return this.chatService.sendPrivateMessage(req.user.sub, dto.recipientId, dto.content);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  async getConversations(@Req() req) {
    return this.chatService.getConversations(req.user.sub);
  }

  @Get('conversations/:userId')
  @ApiOperation({ summary: 'Get conversation with a specific user' })
  async getConversation(@Param('userId', ParseIntPipe) userId: number, @Req() req) {
    return this.chatService.getConversation(req.user.sub, userId);
  }

  @Patch('conversations/:userId/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  async markConversationAsRead(@Param('userId', ParseIntPipe) userId: number, @Req() req) {
    await this.chatService.markConversationAsRead(req.user.sub, userId);
    return { message: 'Conversation marked as read' };
  }

  @Get('unread/:userId')
  @ApiOperation({ summary: 'Get unread message count from a user' })
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number, @Req() req) {
    const count = await this.chatService.getUnreadCount(req.user.sub, userId);
    return { count };
  }
}
