import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateImageDto, ImageSize } from './dto/generate-image.dto';

export interface ReplicateImageResult {
  url: string;
  width: number;
  height: number;
  model: string;
}

@Injectable()
export class ReplicateService {
  private readonly logger = new Logger(ReplicateService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.replicate.com/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('REPLICATE_API_KEY') || '';
  }

  /**
   * 使用 Replicate API 生成图像
   * 默认使用 Stable Diffusion XL 模型
   */
  async generateImage(
    dto: GenerateImageDto,
  ): Promise<ReplicateImageResult[]> {
    if (!this.apiKey) {
      throw new Error('REPLICATE_API_KEY 未配置');
    }

    const size = this.parseSize(dto.size || ImageSize.LARGE_SQUARE);
    const model =
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

    try {
      this.logger.log(`开始使用 Replicate 生成图像: ${dto.prompt}`);

      // 创建预测
      const prediction = await this.createPrediction(model, {
        prompt: dto.prompt,
        negative_prompt: dto.negativePrompt || '',
        width: size.width,
        height: size.height,
        num_outputs: dto.numImages || 1,
        guidance_scale: dto.guidanceScale || 7.5,
        num_inference_steps: dto.steps || 50,
        seed: dto.seed,
      });

      // 等待预测完成
      const result = await this.waitForPrediction(prediction.id);

      // 处理结果
      const images: ReplicateImageResult[] = [];
      if (Array.isArray(result.output)) {
        for (const url of result.output) {
          images.push({
            url,
            width: size.width,
            height: size.height,
            model: 'sdxl',
          });
        }
      } else if (typeof result.output === 'string') {
        images.push({
          url: result.output,
          width: size.width,
          height: size.height,
          model: 'sdxl',
        });
      }

      this.logger.log(`Replicate 图像生成成功，生成了 ${images.length} 张图片`);
      return images;
    } catch (error) {
      this.logger.error('Replicate 图像生成失败', error);
      throw new Error(`Replicate 图像生成失败: ${error.message}`);
    }
  }

  /**
   * 创建预测
   */
  private async createPrediction(model: string, input: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model,
        input,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate API 错误: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * 等待预测完成
   */
  private async waitForPrediction(
    predictionId: string,
    maxAttempts = 60,
  ): Promise<any> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(
        `${this.baseUrl}/predictions/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`获取预测状态失败: ${response.status}`);
      }

      const prediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction;
      }

      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        throw new Error(`预测失败: ${prediction.error || '未知错误'}`);
      }

      // 等待 2 秒后重试
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('预测超时');
  }

  /**
   * 解析图像尺寸
   */
  private parseSize(
    size: ImageSize,
  ): { width: number; height: number; } {
    const [width, height] = size.split('x').map(Number);
    return { width, height };
  }
}

