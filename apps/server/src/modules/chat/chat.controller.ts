import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { User } from '@prisma/client';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('对话')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: '创建新对话' })
  async createConversation(
    @CurrentUser() user: User,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: '获取所有对话' })
  async getConversations(@CurrentUser() user: User) {
    return this.chatService.getConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: '获取单个对话详情' })
  async getConversation(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.chatService.getConversation(id, user.id);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: '删除对话' })
  async deleteConversation(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.chatService.deleteConversation(id, user.id);
  }

  @Put('conversations/:id/title')
  @ApiOperation({ summary: '更新对话标题' })
  async updateConversationTitle(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: { title: string },
  ) {
    return this.chatService.updateConversationTitle(id, user.id, dto.title);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: '发送消息' })
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, user.id, dto);
  }

  @Post('conversations/:id/messages/stream')
  @ApiOperation({ summary: '流式发送消息' })
  async sendMessageStream(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.chatService.sendMessageStream(
        conversationId,
        user.id,
        dto,
      )) {
        if (chunk.type === 'content') {
          // 发送聊天内容
          res.write(`data: ${JSON.stringify({ content: chunk.data })}\n\n`);
        } else if (chunk.type === 'relatedQuestions') {
          // 发送相关问题
          res.write(`data: ${JSON.stringify({ relatedQuestions: chunk.data })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
    } finally {
      res.end();
    }
  }
}

