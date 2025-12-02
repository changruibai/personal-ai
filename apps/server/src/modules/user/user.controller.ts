import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('用户')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@CurrentUser() user: User) {
    return this.userService.findById(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: '更新用户信息' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(user.id, updateUserDto);
  }

  @Get('ai-profile')
  @ApiOperation({ summary: '获取AI分析的用户画像' })
  async getAIProfile(@CurrentUser() user: User) {
    const profile = await this.userService.getProfile(user.id);
    return {
      success: true,
      data: profile,
    };
  }

  @Delete('ai-profile')
  @ApiOperation({ summary: '清除用户画像' })
  async clearAIProfile(@CurrentUser() user: User) {
    await this.userService.clearProfile(user.id);
    return {
      success: true,
      message: '用户画像已清除',
    };
  }
}

