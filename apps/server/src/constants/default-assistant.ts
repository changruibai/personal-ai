/**
 * 默认助手配置
 * 当用户没有任何助手时，系统会自动创建这个默认助手
 */
export const DEFAULT_ASSISTANT_CONFIG = {
  name: '默认助手',
  description: '智能对话助手，可以帮助你解答问题、写作、编程等',
  systemPrompt: `你是一个友好、专业的AI助手。你的职责是：
1. 认真理解用户的问题和需求
2. 提供准确、有帮助的回答
3. 用清晰、易懂的语言进行交流
4. 在适当时候提供相关建议和扩展信息
5. 保持友好和耐心的态度

请用中文回复用户。`,
  model: 'gpt-4o',
  temperature: 0.9,
  maxTokens: 4096,
  isDefault: true,
  // 相关问题推荐配置
  relatedQuestionsEnabled: true,
  relatedQuestionsMode: 'llm' as const, // 'llm' | 'template' | 'disabled'
  relatedQuestionsCount: 3,
};

