import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromptDto {
  @ApiProperty({ example: '代码审查Prompt', description: 'Prompt标题' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: '请帮我审查以下代码，指出潜在问题和优化建议...',
    description: 'Prompt内容',
  })
  @IsString()
  @MaxLength(10000)
  content: string;

  @ApiProperty({
    example: '编程开发',
    description: '分类',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiProperty({
    example: ['代码', '审查', 'TypeScript'],
    description: '标签',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    example: false,
    description: '是否公开',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

