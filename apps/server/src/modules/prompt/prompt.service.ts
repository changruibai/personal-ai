import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Injectable()
export class PromptService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建Prompt
  async create(userId: string, dto: CreatePromptDto) {
    return this.prisma.prompt.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        category: dto.category,
        tags: dto.tags ? JSON.stringify(dto.tags) : null,
        isPublic: dto.isPublic || false,
      },
    });
  }

  // 获取用户的Prompt列表
  async findUserPrompts(userId: string, category?: string) {
    return this.prisma.prompt.findMany({
      where: {
        userId,
        ...(category && { category }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 获取公开的Prompt列表
  async findPublicPrompts(category?: string, search?: string) {
    return this.prisma.prompt.findMany({
      where: {
        isPublic: true,
        ...(category && { category }),
        ...(search && {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } },
          ],
        }),
      },
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  // 获取单个Prompt
  async findOne(id: string, userId?: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt不存在');
    }

    // 非公开的Prompt只能被创建者查看
    if (!prompt.isPublic && prompt.userId !== userId) {
      throw new NotFoundException('Prompt不存在');
    }

    return prompt;
  }

  // 更新Prompt
  async update(id: string, userId: string, dto: UpdatePromptDto) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id, userId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt不存在');
    }

    return this.prisma.prompt.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        tags: dto.tags ? JSON.stringify(dto.tags) : undefined,
        isPublic: dto.isPublic,
      },
    });
  }

  // 删除Prompt
  async remove(id: string, userId: string) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id, userId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt不存在');
    }

    await this.prisma.prompt.delete({ where: { id } });
    return { success: true };
  }

  // 使用Prompt（增加使用次数）
  async usePrompt(id: string) {
    return this.prisma.prompt.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }

  // 复制公开的Prompt到自己的库
  async copyPrompt(id: string, userId: string) {
    const original = await this.findOne(id);

    return this.prisma.prompt.create({
      data: {
        userId,
        title: `${original.title} (复制)`,
        content: original.content,
        category: original.category,
        tags: original.tags, // 已经是 JSON 字符串
        isPublic: false,
      },
    });
  }

  // 获取分类列表
  async getCategories() {
    const categories = await this.prisma.prompt.groupBy({
      by: ['category'],
      where: {
        category: { not: null },
        isPublic: true,
      },
      _count: true,
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count,
    }));
  }
}
