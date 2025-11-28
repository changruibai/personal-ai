import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ example: '新对话', description: '对话标题', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'AI助手ID', required: false })
  @IsOptional()
  @IsString()
  assistantId?: string;
}

