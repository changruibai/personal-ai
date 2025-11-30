/*
 * @Author: 白倡瑞 19929134392@163.com
 * @Date: 2025-11-28 18:57:47
 * @LastEditors: 白倡瑞 19929134392@163.com
 * @LastEditTime: 2025-11-30 10:00:23
 * @FilePath: /personal-ai/apps/server/src/modules/assistant/dto/create-assistant.dto.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssistantDto {
  @ApiProperty({ example: '代码助手', description: 'AI助手名称' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: '专注于代码开发的AI助手',
    description: '描述',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: '头像URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    example: '你是一个专业的编程助手，擅长代码审查、调试和优化...',
    description: '系统提示词',
  })
  @IsString()
  @MaxLength(10000)
  systemPrompt: string;

  @ApiProperty({
    example: 'gpt-4',
    description: 'AI模型',
    required: false,
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    example: 0.7,
    description: '温度参数 (0-2)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({
    example: 2048,
    description: '最大Token数',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(128000)
  maxTokens?: number;

  @ApiProperty({
    example: { codeReview: true, debugging: true },
    description: '技能配置',
    required: false,
  })
  @IsOptional()
  @IsObject()
  skills?: Record<string, unknown>;

  @ApiProperty({
    example: false,
    description: '是否为默认助手',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
