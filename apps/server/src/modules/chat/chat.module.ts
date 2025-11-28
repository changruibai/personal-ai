import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { OpenAIService } from './openai.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, OpenAIService],
  exports: [ChatService],
})
export class ChatModule {}

