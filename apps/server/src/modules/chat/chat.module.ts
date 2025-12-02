/*
 * @Author: 白倡瑞 19929134392@163.com
 * @Date: 2025-11-28 18:56:43
 * @LastEditors: 白倡瑞 19929134392@163.com
 * @LastEditTime: 2025-11-30 09:01:53
 * @FilePath: /personal-ai/apps/server/src/modules/chat/chat.module.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Module, forwardRef } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { OpenAIService } from './openai.service';
import { RelatedQuestionsService } from './related-questions.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, OpenAIService, RelatedQuestionsService],
  exports: [ChatService, OpenAIService],
})
export class ChatModule {}
