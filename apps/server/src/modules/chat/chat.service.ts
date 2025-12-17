import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService, ChatMessage } from './openai.service';
import { RelatedQuestionsService, RelatedQuestionsConfig, RelatedQuestionsMode } from './related-questions.service';
import { UserProfileService } from '../user/user-profile.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { DEFAULT_ASSISTANT_CONFIG } from '../../constants/default-assistant';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
    private readonly relatedQuestionsService: RelatedQuestionsService,
    @Inject(forwardRef(() => UserProfileService))
    private readonly userProfileService: UserProfileService,
  ) {}

  // 创建新对话
  async createConversation(userId: string, dto: CreateConversationDto) {
    let assistantId = dto.assistantId;

    // 如果没有指定助手，尝试使用用户的默认助手
    if (!assistantId) {
      const defaultAssistant = await this.prisma.aIAssistant.findFirst({
        where: { userId, isDefault: true },
      });
      assistantId = defaultAssistant?.id;

      // 如果用户没有默认助手，自动创建一个
      if (!assistantId) {
        const newDefaultAssistant = await this.prisma.aIAssistant.create({
          data: {
            userId,
            ...DEFAULT_ASSISTANT_CONFIG,
          },
        });
        assistantId = newDefaultAssistant.id;
      }
    } else {
      // 验证指定的助手是否存在且用户有权使用（自己的或公开的）
      const assistant = await this.prisma.aIAssistant.findFirst({
        where: {
          id: assistantId,
          OR: [
            { userId }, // 用户自己的助手
            { isPublic: true }, // 公开助手
          ],
        },
      });

      if (!assistant) {
        throw new NotFoundException('助手不存在或无权使用');
      }

      // 如果是公开助手，增加使用计数
      if (assistant.isPublic && assistant.userId !== userId) {
        await this.prisma.aIAssistant.update({
          where: { id: assistantId },
          data: { usageCount: { increment: 1 } } as any,
        });
      }
    }

    return this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title || '新对话',
        assistantId,
      },
      include: {
        assistant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  // 获取用户所有对话（只返回关键信息，不返回消息内容）
  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        assistant: {
          select: {
            id: true,
            name: true,
            isDefault: true,
          },
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

    // 检测是否为身份询问问题
    const isIdentityQuestion = this.userProfileService.isIdentityQuestion(dto.content);

    // 保存用户消息
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: dto.content,
      },
    });

    let aiResponseContent: string;
    let tokenCount: number | undefined;

    if (isIdentityQuestion) {
      // 如果是身份询问，直接返回用户画像
      aiResponseContent = await this.userProfileService.generateProfileResponse(userId);
    } else {
      // 构建消息历史
      const messages: ChatMessage[] = [];

      // 添加系统提示词（包含用户画像上下文）
      const systemPrompt = await this.buildSystemPromptWithProfile(
        conversation.assistant?.systemPrompt || '',
        userId,
      );
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
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

      aiResponseContent = aiResponse.content;
      tokenCount = aiResponse.usage?.total_tokens;

      // 异步分析用户画像（不阻塞响应）
      this.analyzeUserProfileAsync(userId, messages);
    }

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

    // 生成相关问题
    const relatedQuestionsConfig = this.getRelatedQuestionsConfig(conversation.assistant);
    const allMessages: ChatMessage[] = [
      { role: 'user', content: dto.content },
      { role: 'assistant', content: aiResponseContent },
    ];
    const relatedQuestions = await this.relatedQuestionsService.generateRelatedQuestions(
      allMessages,
      relatedQuestionsConfig,
    );

    // 保存AI回复（包含相关问题）
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiResponseContent,
        tokenCount,
        relatedQuestions: relatedQuestions.length > 0 ? JSON.stringify(relatedQuestions) : null,
      },
    });

    return {
      userMessage,
      assistantMessage,
      relatedQuestions,
    };
  }

  /**
   * 构建包含用户画像的系统提示词
   */
  private async buildSystemPromptWithProfile(
    baseSystemPrompt: string,
    userId: string,
  ): Promise<string> {
    const profile = await this.userProfileService.getUserProfile(userId);

    if (!profile || !profile.profession) {
      return baseSystemPrompt;
    }

    const profileContext = this.formatProfileForContext(profile);
    
    return `${baseSystemPrompt}

## 用户画像信息
${profileContext}

请根据用户画像信息，提供更加个性化和针对性的回答。适当调整回答的专业程度和表达方式以匹配用户特点。`;
  }

  /**
   * 格式化用户画像为上下文
   */
  private formatProfileForContext(profile: {
    profession?: string;
    expertise?: string[];
    interests?: string[];
    knowledgeLevel?: string;
    communicationStyle?: string;
    goals?: string[];
  }): string {
    const parts: string[] = [];

    if (profile.profession) {
      parts.push(`- 职业身份：${profile.profession}`);
    }
    if (profile.expertise && profile.expertise.length > 0) {
      parts.push(`- 专业领域：${profile.expertise.join('、')}`);
    }
    if (profile.interests && profile.interests.length > 0) {
      parts.push(`- 兴趣爱好：${profile.interests.join('、')}`);
    }
    if (profile.knowledgeLevel) {
      const levelMap: Record<string, string> = {
        beginner: '初学者',
        intermediate: '中级',
        expert: '专家',
      };
      parts.push(`- 知识水平：${levelMap[profile.knowledgeLevel] || profile.knowledgeLevel}`);
    }
    if (profile.communicationStyle) {
      parts.push(`- 沟通风格偏好：${profile.communicationStyle}`);
    }
    if (profile.goals && profile.goals.length > 0) {
      parts.push(`- 目标需求：${profile.goals.join('、')}`);
    }

    return parts.join('\n');
  }

  /**
   * 异步分析用户画像
   */
  private analyzeUserProfileAsync(userId: string, messages: ChatMessage[]): void {
    // 使用 setImmediate 确保不阻塞响应
    setImmediate(async () => {
      try {
        await this.userProfileService.analyzeAndUpdateProfile(userId, messages);
      } catch (error) {
        console.error('Failed to analyze user profile:', error);
      }
    });
  }

  /**
   * 获取助手的相关问题配置
   */
  private getRelatedQuestionsConfig(assistant: {
    relatedQuestionsEnabled?: boolean;
    relatedQuestionsMode?: string;
    relatedQuestionsCount?: number;
  } | null): RelatedQuestionsConfig {
    return {
      enabled: assistant?.relatedQuestionsEnabled ?? true,
      mode: (assistant?.relatedQuestionsMode as RelatedQuestionsMode) ?? 'llm',
      count: assistant?.relatedQuestionsCount ?? 3,
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

  // 流式发送消息 - 返回类型包含内容和相关问题
  async *sendMessageStream(conversationId: string, userId: string, dto: SendMessageDto): AsyncGenerator<{ type: 'content' | 'relatedQuestions'; data: string | string[] }> {
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

    // 检测是否为身份询问问题
    const isIdentityQuestion = this.userProfileService.isIdentityQuestion(dto.content);

    // 保存用户消息
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: dto.content,
      },
    });

    let fullContent = '';

    if (isIdentityQuestion) {
      // 如果是身份询问，直接返回用户画像
      fullContent = await this.userProfileService.generateProfileResponse(userId);
      // 模拟流式输出
      const chunks = fullContent.match(/.{1,20}/g) || [fullContent];
      for (const chunk of chunks) {
        yield { type: 'content', data: chunk };
      }
    } else {
      // 构建消息历史
      const messages: ChatMessage[] = [];

      // 添加系统提示词（包含用户画像上下文）
      const systemPrompt = await this.buildSystemPromptWithProfile(
        conversation.assistant?.systemPrompt || '',
        userId,
      );
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
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
      for await (const chunk of this.openaiService.chatStream(messages, {
        model: conversation.assistant?.model || 'gpt-4o',
        temperature: conversation.assistant?.temperature || 0.9,
        maxTokens: conversation.assistant?.maxTokens || 4096,
      })) {
        fullContent += chunk;
        yield { type: 'content', data: chunk };
      }

      // 异步分析用户画像（不阻塞响应）
      this.analyzeUserProfileAsync(userId, messages);
    }

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

    // 生成相关问题
    const relatedQuestionsConfig = this.getRelatedQuestionsConfig(conversation.assistant);
    const allMessages: ChatMessage[] = [
      { role: 'user', content: dto.content },
      { role: 'assistant', content: fullContent },
    ];
    const relatedQuestions = await this.relatedQuestionsService.generateRelatedQuestions(
      allMessages,
      relatedQuestionsConfig,
    );

    // 保存完整回复（包含相关问题）
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: fullContent,
        relatedQuestions: relatedQuestions.length > 0 ? JSON.stringify(relatedQuestions) : null,
      },
    });

    // 发送相关问题
    if (relatedQuestions.length > 0) {
      yield { type: 'relatedQuestions', data: relatedQuestions };
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

  // 编辑消息并重新生成 AI 回复（流式）
  async *editMessageStream(
    conversationId: string,
    messageId: string,
    userId: string,
    newContent: string,
  ): AsyncGenerator<{ type: 'content' | 'relatedQuestions'; data: string | string[] }> {
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

    // 找到要编辑的消息
    const messageIndex = conversation.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) {
      throw new NotFoundException('消息不存在');
    }

    const targetMessage = conversation.messages[messageIndex];
    if (targetMessage.role !== 'user') {
      throw new Error('只能编辑用户消息');
    }

    // 删除该消息之后的所有消息（包括 AI 回复）
    const messagesAfter = conversation.messages.slice(messageIndex + 1);
    if (messagesAfter.length > 0) {
      await this.prisma.message.deleteMany({
        where: {
          id: { in: messagesAfter.map((m) => m.id) },
        },
      });
    }

    // 更新用户消息内容
    await this.prisma.message.update({
      where: { id: messageId },
      data: { content: newContent },
    });

    // 构建消息历史（到编辑的消息为止）
    const messages: ChatMessage[] = [];

    // 添加系统提示词（包含用户画像上下文）
    const systemPrompt = await this.buildSystemPromptWithProfile(
      conversation.assistant?.systemPrompt || '',
      userId,
    );
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // 添加编辑消息之前的历史消息
    conversation.messages.slice(0, messageIndex).forEach((msg) => {
      messages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      });
    });

    // 添加编辑后的用户消息
    messages.push({
      role: 'user',
      content: newContent,
    });

    // 流式调用 AI
    let fullContent = '';
    for await (const chunk of this.openaiService.chatStream(messages, {
      model: conversation.assistant?.model || 'gpt-4o',
      temperature: conversation.assistant?.temperature || 0.9,
      maxTokens: conversation.assistant?.maxTokens || 4096,
    })) {
      fullContent += chunk;
      yield { type: 'content', data: chunk };
    }

    // 异步分析用户画像
    this.analyzeUserProfileAsync(userId, messages);

    // 更新对话时间
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 生成相关问题
    const relatedQuestionsConfig = this.getRelatedQuestionsConfig(conversation.assistant);
    const allMessages: ChatMessage[] = [
      { role: 'user', content: newContent },
      { role: 'assistant', content: fullContent },
    ];
    const relatedQuestions = await this.relatedQuestionsService.generateRelatedQuestions(
      allMessages,
      relatedQuestionsConfig,
    );

    // 保存 AI 回复
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: fullContent,
        relatedQuestions: relatedQuestions.length > 0 ? JSON.stringify(relatedQuestions) : null,
      },
    });

    // 发送相关问题
    if (relatedQuestions.length > 0) {
      yield { type: 'relatedQuestions', data: relatedQuestions };
    }
  }

  // 保存中断的消息（用于用户停止生成时保存已生成的内容）
  async savePartialMessage(conversationId: string, userId: string, content: string) {
    // 验证对话存在
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }

    // 保存 AI 回复
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content,
      },
    });

    // 更新对话时间
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}
