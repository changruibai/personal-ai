import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

