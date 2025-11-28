import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { PromptService } from './prompt.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@ApiTags('Prompt模板')
@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  // 公开接口 - 获取公开的Prompt列表
  @Get('public')
  @ApiOperation({ summary: '获取公开的Prompt列表' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findPublicPrompts(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.promptService.findPublicPrompts(category, search);
  }

  // 公开接口 - 获取分类列表
  @Get('categories')
  @ApiOperation({ summary: '获取Prompt分类列表' })
  async getCategories() {
    return this.promptService.getCategories();
  }

  // 需要认证的接口
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建Prompt' })
  async create(@CurrentUser() user: User, @Body() dto: CreatePromptDto) {
    return this.promptService.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的Prompt列表' })
  @ApiQuery({ name: 'category', required: false })
  async findMyPrompts(
    @CurrentUser() user: User,
    @Query('category') category?: string,
  ) {
    return this.promptService.findUserPrompts(user.id, category);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取单个Prompt' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.promptService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新Prompt' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePromptDto,
  ) {
    return this.promptService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除Prompt' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.promptService.remove(id, user.id);
  }

  @Post(':id/use')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '使用Prompt（增加使用次数）' })
  async usePrompt(@Param('id') id: string) {
    return this.promptService.usePrompt(id);
  }

  @Post(':id/copy')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '复制Prompt到我的库' })
  async copyPrompt(@CurrentUser() user: User, @Param('id') id: string) {
    return this.promptService.copyPrompt(id, user.id);
  }
}

