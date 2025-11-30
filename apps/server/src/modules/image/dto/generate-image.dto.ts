import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ImageProvider {
  REPLICATE = 'replicate',
  HUGGINGFACE = 'huggingface',
}

export enum ImageSize {
  SQUARE = '512x512',
  PORTRAIT = '512x768',
  LANDSCAPE = '768x512',
  LARGE_SQUARE = '1024x1024',
}

export class GenerateImageDto {
  @ApiProperty({
    example: 'A beautiful sunset over the ocean, digital art',
    description: '图像生成提示词',
  })
  @IsString()
  @MaxLength(2000)
  prompt: string;

  @ApiProperty({
    example: 'replicate',
    description: '图像生成服务提供商',
    enum: ImageProvider,
  })
  @IsEnum(ImageProvider)
  provider: ImageProvider;

  @ApiProperty({
    example: '1024x1024',
    description: '图像尺寸',
    enum: ImageSize,
    required: false,
  })
  @IsOptional()
  @IsEnum(ImageSize)
  size?: ImageSize;

  @ApiProperty({
    example: 'low quality, blurry',
    description: '负面提示词（不希望出现的内容）',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  negativePrompt?: string;

  @ApiProperty({
    example: 1,
    description: '生成图像数量',
    required: false,
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  numImages?: number;

  @ApiProperty({
    example: 7.5,
    description: 'Guidance scale（控制提示词遵循程度）',
    required: false,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  guidanceScale?: number;

  @ApiProperty({
    example: 50,
    description: '推理步数（越高质量越好但越慢）',
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  steps?: number;

  @ApiProperty({
    example: 42,
    description: '随机种子（用于生成可重现的结果）',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  seed?: number;
}

