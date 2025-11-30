/*
 * @Author: 白倡瑞 19929134392@163.com
 * @Date: 2025-11-28 18:57:14
 * @LastEditors: 白倡瑞 19929134392@163.com
 * @LastEditTime: 2025-11-30 09:02:04
 * @FilePath: /personal-ai/apps/server/src/modules/chat/dto/send-message.dto.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '你好，请帮我...', description: '消息内容' })
  @IsString()
  @IsNotEmpty({ message: '消息内容不能为空' })
  content: string;
}
