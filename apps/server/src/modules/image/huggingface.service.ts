import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateImageDto } from './dto/generate-image.dto';

export interface HuggingFaceImageResult {
  url: string;
  width: number;
  height: number;
  model: string;
}

@Injectable()
export class HuggingFaceService {
  private readonly logger = new Logger(HuggingFaceService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api-inference.huggingface.co/models';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('HUGGINGFACE_API_KEY') || '';
  }

  /**
   * 使用 Hugging Face Inference API 生成图像
   * 默认使用 Stable Diffusion v1.5 模型
   */
  async generateImage(
    dto: GenerateImageDto,
  ): Promise<HuggingFaceImageResult[]> {
    if (!this.apiKey) {
      throw new Error('HUGGINGFACE_API_KEY 未配置');
    }

    // 使用 Stable Diffusion 2.1 模型
    const model = 'stabilityai/stable-diffusion-2-1';
    const modelUrl = `${this.baseUrl}/${model}`;

    try {
      this.logger.log(`开始使用 Hugging Face 生成图像: ${dto.prompt}`);

      const results: HuggingFaceImageResult[] = [];
      const numImages = dto.numImages || 1;

      // Hugging Face 需要逐个生成图像
      for (let i = 0; i < numImages; i++) {
        const imageBlob = await this.generateSingleImage(modelUrl, {
          inputs: dto.prompt,
          negative_prompt: dto.negativePrompt,
          guidance_scale: dto.guidanceScale || 7.5,
          num_inference_steps: dto.steps || 50,
        });

        // 将 Blob 转换为 Base64
        const base64 = await this.blobToBase64(imageBlob);
        results.push({
          url: `data:image/png;base64,${base64}`,
          width: 512,
          height: 512,
          model: 'sd-2.1',
        });
      }

      this.logger.log(
        `Hugging Face 图像生成成功，生成了 ${results.length} 张图片`,
      );
      return results;
    } catch (error) {
      this.logger.error('Hugging Face 图像生成失败', error);
      throw new Error(`Hugging Face 图像生成失败: ${error.message}`);
    }
  }

  /**
   * 生成单张图像
   */
  private async generateSingleImage(
    modelUrl: string,
    params: any,
  ): Promise<Blob> {
    let retries = 3;

    while (retries > 0) {
      try {
        const response = await fetch(modelUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorText = await response.text();

          // 如果模型正在加载，等待后重试
          if (response.status === 503) {
            this.logger.warn('模型正在加载，等待 20 秒后重试...');
            await new Promise((resolve) => setTimeout(resolve, 20000));
            retries--;
            continue;
          }

          throw new Error(
            `Hugging Face API 错误: ${response.status} - ${errorText}`,
          );
        }

        return await response.blob();
      } catch (error) {
        if (retries === 1) {
          throw error;
        }
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    throw new Error('生成图像失败，已达最大重试次数');
  }

  /**
   * 将 Blob 转换为 Base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  }

  /**
   * 列出可用的图像生成模型
   */
  async listAvailableModels(): Promise<string[]> {
    return [
      'stabilityai/stable-diffusion-2-1',
      'runwayml/stable-diffusion-v1-5',
      'CompVis/stable-diffusion-v1-4',
      'prompthero/openjourney',
      'dreamlike-art/dreamlike-photoreal-2.0',
    ];
  }
}

