import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImageService } from './image.service';
import { GenerateImageDto, ImageProvider } from './dto/generate-image.dto';

@ApiTags('图像生成')
@Controller('image')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('generate')
  @ApiOperation({ summary: '生成图像' })
  async generateImage(@CurrentUser() user: User, @Body() dto: GenerateImageDto) {
    return this.imageService.generateImage(user.id, dto);
  }

  @Post('generate-in-conversation')
  @ApiOperation({ summary: '在对话中生成图像' })
  async generateImageInConversation(
    @CurrentUser() user: User,
    @Body() body: { conversationId: string } & GenerateImageDto,
  ) {
    const { conversationId, ...dto } = body;
    return this.imageService.generateImageInConversation(
      conversationId,
      user.id,
      dto,
    );
  }

  @Get('models')
  @ApiOperation({ summary: '获取可用的图像生成模型' })
  async getAvailableModels(@Query('provider') provider: ImageProvider) {
    return this.imageService.getAvailableModels(provider);
  }
}

