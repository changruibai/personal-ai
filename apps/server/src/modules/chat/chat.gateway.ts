/*
 * @Author: 白倡瑞 19929134392@163.com
 * @Date: 2025-11-28 18:57:20
 * @LastEditors: 白倡瑞 19929134392@163.com
 * @LastEditTime: 2025-11-30 09:01:48
 * @FilePath: /personal-ai/apps/server/src/modules/chat/chat.gateway.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: {
      conversationId: string;
      userId: string;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // 发送流式消息
      for await (const chunk of this.chatService.sendMessageStream(
        data.conversationId,
        data.userId,
        { content: data.content },
      )) {
        client.emit('messageChunk', { chunk });
      }
      client.emit('messageComplete');
    } catch (error) {
      client.emit('messageError', { error: (error as Error).message });
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }
}
