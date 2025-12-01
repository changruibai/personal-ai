import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';

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

    return this.prisma.aIAssistant.update({
      where: { id: assistant.id },
      data: dto,
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
        relatedQuestionsEnabled: original.relatedQuestionsEnabled,
        relatedQuestionsMode: original.relatedQuestionsMode,
        relatedQuestionsCount: original.relatedQuestionsCount,
      },
    });
  }
}
