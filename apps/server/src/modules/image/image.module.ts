import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { ReplicateService } from './replicate.service';
import { HuggingFaceService } from './huggingface.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ImageController],
  providers: [ImageService, ReplicateService, HuggingFaceService],
  exports: [ImageService],
})
export class ImageModule {}

