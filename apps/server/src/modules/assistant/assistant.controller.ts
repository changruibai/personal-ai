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
import { AssistantService } from './assistant.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';

@ApiTags('AI助手')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('assistants')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  // ==================== 助手市场相关 API ====================

  @Get('market')
  @ApiOperation({ summary: '获取公开助手市场列表' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['popular', 'newest'], description: '排序方式' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'offset', required: false, description: '偏移量' })
  async getMarket(
    @CurrentUser() user: User,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'popular' | 'newest',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.assistantService.getPublicAssistants(user.id, {
      search,
      sortBy,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('market/:id')
  @ApiOperation({ summary: '获取公开助手详情' })
  async getMarketAssistant(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.assistantService.getPublicAssistant(id, user.id);
  }

  @Get('favorites')
  @ApiOperation({ summary: '获取收藏的助手列表' })
  async getFavorites(@CurrentUser() user: User) {
    return this.assistantService.getFavoriteAssistants(user.id);
  }

  @Post('market/:id/favorite')
  @ApiOperation({ summary: '收藏公开助手' })
  async favoriteAssistant(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.assistantService.favoriteAssistant(user.id, id);
  }

  @Delete('market/:id/favorite')
  @ApiOperation({ summary: '取消收藏公开助手' })
  async unfavoriteAssistant(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.assistantService.unfavoriteAssistant(user.id, id);
  }

  @Post('market/:id/use')
  @ApiOperation({ summary: '使用公开助手（获取助手信息用于对话）' })
  async usePublicAssistant(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.assistantService.usePublicAssistant(user.id, id);
  }

  @Post('market/:id/copy')
  @ApiOperation({ summary: '复制公开助手到自己账户' })
  async copyPublicAssistant(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.assistantService.copyPublicAssistant(user.id, id);
  }

  // ==================== 个人助手管理 API ====================

  @Post()
  @ApiOperation({ summary: '创建AI助手' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateAssistantDto,
  ) {
    return this.assistantService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有AI助手' })
  async findAll(@CurrentUser() user: User) {
    return this.assistantService.findAll(user.id);
  }

  @Get('default')
  @ApiOperation({ summary: '获取默认AI助手' })
  async getDefault(@CurrentUser() user: User) {
    return this.assistantService.getDefault(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个AI助手' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assistantService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新AI助手' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateAssistantDto,
  ) {
    return this.assistantService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除AI助手' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assistantService.remove(id, user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '复制AI助手' })
  async duplicate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assistantService.duplicate(id, user.id);
  }
}

