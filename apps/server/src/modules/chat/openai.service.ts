import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
    });
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}) {
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 2048,
    } = options;

    const response = await this.openai.chat.completions.create({
      model,
      messages: messages as ChatCompletionMessageParam[],
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
    };
  }

  async *chatStream(messages: ChatMessage[], options: ChatOptions = {}) {
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 2048,
    } = options;

    const stream = await this.openai.chat.completions.create({
      model,
      messages: messages as ChatCompletionMessageParam[],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

