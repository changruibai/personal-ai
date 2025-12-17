import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';

// 助手市场服务
@Injectable()
export class AssistantService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建AI助手
  async create(userId: string, dto: CreateAssistantDto) {
    // 如果设置为默认，先取消其他默认
    if (dto.isDefault) {
      await this.prisma.aIAssistant.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.aIAssistant.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        avatar: dto.avatar,
        systemPrompt: dto.systemPrompt,
        model: dto.model || 'gpt-4o',
        temperature: dto.temperature ?? 0.9,
        maxTokens: dto.maxTokens || 4096,
        skills: dto.skills ? JSON.stringify(dto.skills) : null,
        isDefault: dto.isDefault || false,
        isPublic: dto.isPublic || false,
        relatedQuestionsEnabled: dto.relatedQuestionsEnabled ?? true,
        relatedQuestionsMode: dto.relatedQuestionsMode || 'llm',
        relatedQuestionsCount: dto.relatedQuestionsCount ?? 3,
      },
    });
  }

  // 获取用户所有AI助手
  async findAll(userId: string) {
    return this.prisma.aIAssistant.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // 获取单个AI助手
  async findOne(id: string, userId: string) {
    const assistant = await this.prisma.aIAssistant.findFirst({
      where: { id, userId },
    });

    if (!assistant) {
      throw new NotFoundException('AI助手不存在');
    }

    return assistant;
  }

  // 更新AI助手
  async update(id: string, userId: string, dto: UpdateAssistantDto) {
    const assistant = await this.findOne(id, userId);

    // 如果设置为默认，先取消其他默认
    if (dto.isDefault) {
      await this.prisma.aIAssistant.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // 构建更新数据，处理 skills 字段序列化
    const { skills, ...restDto } = dto;
    const updateData: Record<string, unknown> = { ...restDto };
    
    // skills 需要转为 JSON 字符串
    if (skills !== undefined) {
      updateData.skills = skills ? JSON.stringify(skills) : null;
    }

    return this.prisma.aIAssistant.update({
      where: { id: assistant.id },
      data: updateData,
    });
  }

  // 删除AI助手
  async remove(id: string, userId: string) {
    const assistant = await this.findOne(id, userId);

    await this.prisma.aIAssistant.delete({
      where: { id: assistant.id },
    });

    return { success: true };
  }

  // 获取默认AI助手
  async getDefault(userId: string) {
    return this.prisma.aIAssistant.findFirst({
      where: { userId, isDefault: true },
    });
  }

  // 复制AI助手
  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id, userId);

    return this.prisma.aIAssistant.create({
      data: {
        userId,
        name: `${original.name} (复制)`,
        description: original.description,
        avatar: original.avatar,
        systemPrompt: original.systemPrompt,
        model: original.model,
        temperature: original.temperature,
        maxTokens: original.maxTokens,
        skills: original.skills,
        isDefault: false,
        isPublic: false, // 复制的助手默认为私有
        relatedQuestionsEnabled: original.relatedQuestionsEnabled,
        relatedQuestionsMode: original.relatedQuestionsMode,
        relatedQuestionsCount: original.relatedQuestionsCount,
      },
    });
  }

  // ==================== 助手市场相关方法 ====================

  // 获取公开助手市场列表
  async getPublicAssistants(
    userId: string,
    options?: {
      search?: string;
      sortBy?: 'popular' | 'newest';
      limit?: number;
      offset?: number;
    },
  ) {
    const { search, sortBy = 'popular', limit = 20, offset = 0 } = options || {};

    const where: Record<string, unknown> = {
      isPublic: true,
    };

    // 搜索过滤
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // 排序方式
    const orderBy =
      sortBy === 'popular'
        ? [{ usageCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const [assistants, total] = await Promise.all([
      this.prisma.aIAssistant.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      }),
      this.prisma.aIAssistant.count({ where }),
    ]);

    // 检查当前用户是否已收藏
    const favoriteIds = userId
      ? (
          await this.prisma.assistantFavorite.findMany({
            where: {
              userId,
              assistantId: { in: assistants.map((a) => a.id) },
            },
            select: { assistantId: true },
          })
        ).map((f) => f.assistantId)
      : [];

    return {
      data: assistants.map((assistant) => ({
        ...assistant,
        favoriteCount: assistant._count.favorites,
        isFavorited: favoriteIds.includes(assistant.id),
        isOwner: assistant.userId === userId,
      })),
      total,
      limit,
      offset,
    };
  }

  // 获取公开助手详情（任何人都可以查看）
  async getPublicAssistant(id: string, userId?: string) {
    const assistant = await this.prisma.aIAssistant.findFirst({
      where: { id, isPublic: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    if (!assistant) {
      throw new NotFoundException('公开助手不存在');
    }

    // 检查是否已收藏
    let isFavorited = false;
    if (userId) {
      const favorite = await this.prisma.assistantFavorite.findUnique({
        where: {
          userId_assistantId: {
            userId,
            assistantId: id,
          },
        },
      });
      isFavorited = !!favorite;
    }

    return {
      ...assistant,
      favoriteCount: assistant._count.favorites,
      isFavorited,
      isOwner: assistant.userId === userId,
    };
  }

  // 收藏助手
  async favoriteAssistant(userId: string, assistantId: string) {
    // 检查助手是否存在且公开
    const assistant = await this.prisma.aIAssistant.findFirst({
      where: { id: assistantId, isPublic: true },
    });

    if (!assistant) {
      throw new NotFoundException('公开助手不存在');
    }

    // 检查是否已收藏
    const existing = await this.prisma.assistantFavorite.findUnique({
      where: {
        userId_assistantId: {
          userId,
          assistantId,
        },
      },
    });

    if (existing) {
      return { message: '已收藏' };
    }

    await this.prisma.assistantFavorite.create({
      data: {
        userId,
        assistantId,
      },
    });

    return { message: '收藏成功' };
  }

  // 取消收藏助手
  async unfavoriteAssistant(userId: string, assistantId: string) {
    const existing = await this.prisma.assistantFavorite.findUnique({
      where: {
        userId_assistantId: {
          userId,
          assistantId,
        },
      },
    });

    if (!existing) {
      return { message: '未收藏' };
    }

    await this.prisma.assistantFavorite.delete({
      where: {
        userId_assistantId: {
          userId,
          assistantId,
        },
      },
    });

    return { message: '取消收藏成功' };
  }

  // 获取用户收藏的助手列表
  async getFavoriteAssistants(userId: string) {
    const favorites = await this.prisma.assistantFavorite.findMany({
      where: { userId },
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
            _count: {
              select: {
                favorites: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      ...f.assistant,
      favoriteCount: f.assistant._count.favorites,
      isFavorited: true,
      isOwner: f.assistant.userId === userId,
      favoritedAt: f.createdAt,
    }));
  }

  // 使用公开助手开始对话（复制到用户账户或直接引用）
  async usePublicAssistant(userId: string, assistantId: string) {
    const assistant = await this.prisma.aIAssistant.findFirst({
      where: { id: assistantId, isPublic: true },
    });

    if (!assistant) {
      throw new NotFoundException('公开助手不存在');
    }

    // 增加使用计数
    await this.prisma.aIAssistant.update({
      where: { id: assistantId },
      data: { usageCount: { increment: 1 } } as any,
    });

    return assistant;
  }

  // 复制公开助手到自己账户
  async copyPublicAssistant(userId: string, assistantId: string) {
    const original = await this.prisma.aIAssistant.findFirst({
      where: { id: assistantId, isPublic: true },
    });

    if (!original) {
      throw new NotFoundException('公开助手不存在');
    }

    // 增加使用计数
    await this.prisma.aIAssistant.update({
      where: { id: assistantId },
      data: { usageCount: { increment: 1 } } as any,
    });

    // 复制到用户账户
    return this.prisma.aIAssistant.create({
      data: {
        userId,
        name: `${original.name}`,
        description: original.description,
        avatar: original.avatar,
        systemPrompt: original.systemPrompt,
        model: original.model,
        temperature: original.temperature,
        maxTokens: original.maxTokens,
        skills: original.skills,
        isDefault: false,
        isPublic: false, // 复制的版本默认不公开
        relatedQuestionsEnabled: original.relatedQuestionsEnabled,
        relatedQuestionsMode: original.relatedQuestionsMode,
        relatedQuestionsCount: original.relatedQuestionsCount,
      },
    });
  }
}
