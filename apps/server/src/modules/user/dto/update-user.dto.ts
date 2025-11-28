import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: '张三', description: '用户名', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: '头像URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

