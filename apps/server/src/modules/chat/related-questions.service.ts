import { Injectable } from '@nestjs/common';
import { OpenAIService, ChatMessage } from './openai.service';

/**
 * 相关问题生成模式
 */
export type RelatedQuestionsMode = 'llm' | 'template' | 'disabled';

/**
 * 相关问题配置
 */
export interface RelatedQuestionsConfig {
  enabled: boolean;
  mode: RelatedQuestionsMode;
  count: number;
}

/**
 * 关键词模板映射
 * 基于问题中的关键词生成相关问题
 */
const KEYWORD_TEMPLATES: Record<string, string[]> = {
  // 编程相关
  代码: ['如何优化这段代码？', '有没有更简洁的写法？', '这段代码的时间复杂度是多少？'],
  bug: ['如何调试这个问题？', '常见的解决方案有哪些？', '如何预防类似问题？'],
  函数: ['这个函数的参数有哪些？', '如何给函数添加类型注解？', '这个函数有副作用吗？'],
  api: ['这个 API 的请求参数是什么？', '如何处理 API 错误？', '有相关的文档吗？'],
  性能: ['有哪些性能优化方法？', '如何测量性能？', '性能瓶颈在哪里？'],

  // 学习相关
  学习: ['有什么好的学习资源推荐？', '学习路线图是怎样的？', '如何制定学习计划？'],
  教程: ['有配套的练习吗？', '适合什么水平的学习者？', '学完能达到什么程度？'],
  概念: ['能举一个具体的例子吗？', '这和其他概念有什么关系？', '实际应用场景是什么？'],

  // 解释类
  什么是: ['它的工作原理是什么？', '有哪些实际应用？', '和类似概念有什么区别？'],
  为什么: ['还有其他原因吗？', '有没有例外情况？', '如何验证这个解释？'],
  如何: ['有没有更简单的方法？', '需要注意什么？', '有成功案例吗？'],
  怎么: ['具体步骤是什么？', '需要准备什么？', '有什么替代方案？'],

  // 产品/设计相关
  设计: ['有设计规范参考吗？', '如何评估设计效果？', '目标用户是谁？'],
  用户: ['用户的核心需求是什么？', '如何收集用户反馈？', '用户体验如何优化？'],
  功能: ['功能优先级如何排序？', '有没有 MVP 版本？', '如何测试功能？'],

  // 项目管理
  项目: ['项目时间线是怎样的？', '有哪些风险点？', '如何分配资源？'],
  计划: ['如何跟踪进度？', '有备选方案吗？', '关键里程碑是什么？'],
  团队: ['如何协作？', '职责如何分配？', '沟通方式是什么？'],

  // AI 相关
  ai: ['AI 的准确率如何？', '有哪些局限性？', '如何持续改进？'],
  模型: ['模型的训练数据是什么？', '如何评估模型效果？', '模型有什么偏见吗？'],
  chatgpt: ['ChatGPT 的最新功能有哪些？', '如何写好 Prompt？', '有哪些使用技巧？'],
  prompt: ['如何优化 Prompt？', 'Prompt 工程的最佳实践？', '有模板参考吗？'],
};

/**
 * 通用问题模板（当没有匹配到关键词时使用）
 */
const GENERAL_TEMPLATES = [
  '能详细解释一下吗？',
  '有具体的例子吗？',
  '还有其他相关的内容吗？',
  '如何在实践中应用？',
  '有什么需要注意的地方？',
  '相关的最佳实践是什么？',
  '有推荐的资源或文档吗？',
];

@Injectable()
export class RelatedQuestionsService {
  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * 生成相关问题
   * @param messages 对话历史
   * @param config 相关问题配置
   * @returns 相关问题列表
   */
  async generateRelatedQuestions(
    messages: ChatMessage[],
    config: RelatedQuestionsConfig,
  ): Promise<string[]> {
    // 如果禁用，返回空数组
    if (!config.enabled || config.mode === 'disabled') {
      return [];
    }

    // 获取用户最新问题
    const userMessages = messages.filter((m) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    // 获取 AI 最新回复
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content || '';

    // 根据模式生成问题
    if (config.mode === 'llm') {
      return this.generateByLLM(lastUserMessage, lastAssistantMessage, config.count);
    } else if (config.mode === 'template') {
      return this.generateByTemplate(lastUserMessage, config.count);
    }

    return [];
  }

  /**
   * 使用 LLM 生成相关问题
   */
  private async generateByLLM(
    userQuestion: string,
    aiAnswer: string,
    count: number,
  ): Promise<string[]> {
    const systemPrompt = `你是一个智能助手，负责根据用户的问题和 AI 的回答生成相关的后续问题。

要求：
1. 生成 ${count} 个相关问题
2. 问题要有价值，能帮助用户深入了解主题
3. 问题要多样化，覆盖不同角度（如原理、应用、比较、扩展等）
4. 问题要简洁明了，不超过 30 个字
5. 问题要与当前对话上下文相关
6. 不要生成重复或太相似的问题
7. 只返回问题列表，每行一个问题，不要有序号或其他标记`;

    const userPrompt = `用户问题：${userQuestion}

AI 回答摘要：${aiAnswer.slice(0, 500)}${aiAnswer.length > 500 ? '...' : ''}

请生成 ${count} 个相关的后续问题：`;

    try {
      const response = await this.openaiService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: 'gpt-4o-mini', // 使用更快更便宜的模型生成相关问题
          temperature: 0.8,
          maxTokens: 200,
        },
      );

      // 解析返回的问题
      const questions = response.content
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 0 && q.length <= 50)
        .slice(0, count);

      return questions;
    } catch (error) {
      console.error('LLM 生成相关问题失败:', error);
      // 降级到模板方式
      return this.generateByTemplate(userQuestion, count);
    }
  }

  /**
   * 使用关键词模板生成相关问题
   */
  private generateByTemplate(userQuestion: string, count: number): string[] {
    const lowerQuestion = userQuestion.toLowerCase();
    const matchedQuestions: string[] = [];

    // 遍历关键词模板，找到匹配的问题
    for (const [keyword, templates] of Object.entries(KEYWORD_TEMPLATES)) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        matchedQuestions.push(...templates);
      }
    }

    // 如果没有匹配，使用通用模板
    if (matchedQuestions.length === 0) {
      matchedQuestions.push(...GENERAL_TEMPLATES);
    }

    // 随机打乱并取指定数量
    const shuffled = matchedQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

