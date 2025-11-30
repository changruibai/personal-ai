import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService, ChatMessage } from './openai.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
  ) {}

  // 创建新对话
  async createConversation(userId: string, dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title || '新对话',
        assistantId: dto.assistantId,
      },
      include: {
        assistant: true,
      },
    });
  }

  // 获取用户所有对话
  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        // 优化：返回完整的 assistant 信息，避免前端重复请求
        assistant: {
          select: {
            id: true,
            name: true,
            description: true,
            avatar: true,
            model: true,
            temperature: true,
            maxTokens: true,
            systemPrompt: true,
            skills: true,
            isDefault: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // 获取单个对话及消息
  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        assistant: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }

    return conversation;
  }

  // 发送消息并获取AI回复
  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    // 验证对话存在
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        assistant: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }

    // 保存用户消息
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: dto.content,
      },
    });

    // 构建消息历史
    const messages: ChatMessage[] = [];

    // 添加系统提示词
    if (conversation.assistant?.systemPrompt) {
      messages.push({
        role: 'system',
        content: conversation.assistant.systemPrompt,
      });
    }

    // 添加历史消息
    conversation.messages.forEach((msg) => {
      messages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      });
    });

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: dto.content,
    });

    // 调用AI
    const aiResponse = await this.openaiService.chat(messages, {
      model: conversation.assistant?.model || 'gpt-4o',
      temperature: conversation.assistant?.temperature || 0.9,
      maxTokens: conversation.assistant?.maxTokens || 4096,
    });

    // 保存AI回复
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiResponse.content,
        tokenCount: aiResponse.usage?.total_tokens,
      },
    });

    // 更新对话时间和标题
    if (conversation.messages.length === 0) {
      // 为首次消息生成智能标题
      const title = this.generateConversationTitle(dto.content);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          title,
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    return {
      userMessage,
      assistantMessage,
    };
  }

  // 删除对话
  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  // 流式发送消息
  async *sendMessageStream(conversationId: string, userId: string, dto: SendMessageDto) {
    // 验证对话存在
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        assistant: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }

    // 保存用户消息
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: dto.content,
      },
    });

    // 构建消息历史
    const messages: ChatMessage[] = [];

    if (conversation.assistant?.systemPrompt) {
      messages.push({
        role: 'system',
        content: conversation.assistant.systemPrompt,
      });
    }

    conversation.messages.forEach((msg) => {
      messages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      });
    });

    messages.push({
      role: 'user',
      content: dto.content,
    });

    // 流式调用AI
    let fullContent = '';
    for await (const chunk of this.openaiService.chatStream(messages, {
      model: conversation.assistant?.model || 'gpt-4o',
      temperature: conversation.assistant?.temperature || 0.9,
      maxTokens: conversation.assistant?.maxTokens || 4096,
    })) {
      fullContent += chunk;
      yield chunk;
    }

    // 保存完整回复
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: fullContent,
      },
    });

    // 更新对话时间和标题
    if (conversation.messages.length === 0) {
      // 为首次消息生成智能标题
      const title = this.generateConversationTitle(dto.content);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          title,
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }
  }

  // 生成会话标题
  private generateConversationTitle(content: string): string {
    // 清理内容：去除多余空白字符
    const cleaned = content.trim().replace(/\s+/g, ' ');

    // 如果内容很短，直接使用
    if (cleaned.length <= 30) {
      return cleaned;
    }

    // 尝试提取第一句话
    const firstSentence = cleaned.match(/^[^。！？.!?]+[。！？.!?]?/);
    if (firstSentence && firstSentence[0].length <= 50) {
      return firstSentence[0];
    }

    // 截取前30个字符并添加省略号
    return cleaned.slice(0, 30) + '...';
  }

  // 更新对话标题
  async updateConversationTitle(conversationId: string, userId: string, title: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }
}
