/*
 * @Author: 白倡瑞 19929134392@163.com
 * @Date: 2025-11-28 18:57:12
 * @LastEditors: 白倡瑞 19929134392@163.com
 * @LastEditTime: 2025-11-30 09:02:01
 * @FilePath: /personal-ai/apps/server/src/modules/chat/dto/create-conversation.dto.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
