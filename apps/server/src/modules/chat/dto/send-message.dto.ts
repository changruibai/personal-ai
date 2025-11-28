import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '你好，请帮我...', description: '消息内容' })
  @IsString()
  @IsNotEmpty({ message: '消息内容不能为空' })
  content: string;
}

