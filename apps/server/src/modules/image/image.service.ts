import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReplicateService } from './replicate.service';
import { HuggingFaceService } from './huggingface.service';
import { GenerateImageDto, ImageProvider } from './dto/generate-image.dto';

export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  provider: string;
  model: string;
  prompt: string;
  createdAt: Date;
}

@Injectable()
export class ImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly replicateService: ReplicateService,
    private readonly huggingfaceService: HuggingFaceService,
  ) {}

  /**
   * 生成图像
   */
  async generateImage(
    userId: string,
    dto: GenerateImageDto,
  ): Promise<GeneratedImage[]> {
    let results;

    // 根据提供商选择服务
    switch (dto.provider) {
      case ImageProvider.REPLICATE:
        results = await this.replicateService.generateImage(dto);
        break;
      case ImageProvider.HUGGINGFACE:
        results = await this.huggingfaceService.generateImage(dto);
        break;
      default:
        throw new BadRequestException('不支持的图像生成服务提供商');
    }

    // 将生成的图像信息保存到数据库（作为消息）
    const generatedImages: GeneratedImage[] = [];
    for (const result of results) {
      generatedImages.push({
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: result.url,
        width: result.width,
        height: result.height,
        provider: dto.provider,
        model: result.model,
        prompt: dto.prompt,
        createdAt: new Date(),
      });
    }

    return generatedImages;
  }

  /**
   * 在对话中生成并保存图像消息
   */
  async generateImageInConversation(
    conversationId: string,
    userId: string,
    dto: GenerateImageDto,
  ) {
    // 验证对话存在且属于当前用户
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new BadRequestException('对话不存在或无权访问');
    }

    // 生成图像
    const images = await this.generateImage(userId, dto);

    // 保存用户的图像生成请求消息
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: `生成图像: ${dto.prompt}`,
        messageType: 'text',
      },
    });

    // 保存生成的图像消息
    const savedMessages = [];
    for (const image of images) {
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: dto.prompt,
          messageType: 'image',
          imageUrl: image.url,
          imageProvider: dto.provider,
          imageModel: image.model,
          metadata: JSON.stringify({
            width: image.width,
            height: image.height,
            negativePrompt: dto.negativePrompt,
            guidanceScale: dto.guidanceScale,
            steps: dto.steps,
            seed: dto.seed,
          }),
        },
      });
      savedMessages.push(message);
    }

    // 更新对话时间
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return savedMessages;
  }

  /**
   * 获取可用的图像生成模型列表
   */
  async getAvailableModels(provider: ImageProvider) {
    switch (provider) {
      case ImageProvider.REPLICATE:
        return [
          {
            id: 'sdxl',
            name: 'Stable Diffusion XL',
            description: '高质量的图像生成模型',
          },
        ];
      case ImageProvider.HUGGINGFACE:
        const models = await this.huggingfaceService.listAvailableModels();
        return models.map((model) => ({
          id: model,
          name: model,
          description: 'Hugging Face 模型',
        }));
      default:
        return [];
    }
  }
}

