'use client';

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Loader2, Lightbulb, Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { chatApi } from '@/lib/api';
import { useChatStore, type Message, type Conversation } from '@/store/chat';
import { useToast } from '@/components/ui/use-toast';
import MarkdownRenderer from '@/components/chat/markdown-renderer';
import MarkdownEditor from '@/components/chat/markdown-editor';

const ChatDetailPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isStreaming, streamingContent, setStreaming, appendStreamContent, resetStreamContent } =
    useChatStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  // 流式响应时的临时相关问题（尚未保存到数据库）
  const [streamingRelatedQuestions, setStreamingRelatedQuestions] = useState<string[]>([]);

  // 复制消息内容
  const handleCopyMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedMessageId(messageId);
        toast({
          title: '已复制到剪贴板',
          duration: 2000,
        });
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch {
        toast({
          variant: 'destructive',
          title: '复制失败',
          description: '请手动选择文本复制',
        });
      }
    },
    [toast],
  );

  // 获取当前对话详情
  const { data: currentConversation, isLoading: loadingConversation } = useQuery<Conversation>({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const res = await chatApi.getConversation(conversationId);
      return res.data;
    },
    enabled: !!conversationId,
  });

  // 优化：直接从对话数据中获取 assistant 信息
  const assistant = currentConversation?.assistant;

  // 更新消息列表（包含解析相关问题）
  useEffect(() => {
    if (currentConversation?.messages) {
      // 解析每条消息中的 relatedQuestions 字段
      const parsedMessages = currentConversation.messages.map((msg) => {
        if (msg.role === 'assistant') {
          const rawRelatedQuestions = (
            msg as unknown as { relatedQuestions?: string | string[] | null }
          ).relatedQuestions;
          if (typeof rawRelatedQuestions === 'string') {
            try {
              const parsed = JSON.parse(rawRelatedQuestions);
              return { ...msg, relatedQuestions: parsed };
            } catch {
              return msg;
            }
          }
        }
        return msg;
      });
      setMessages(parsedMessages);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  // 获取最后一条 assistant 消息的相关问题
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastAssistantRelatedQuestions = useMemo(() => {
    // 如果正在流式响应，返回临时相关问题
    if (streamingRelatedQuestions.length > 0) {
      return streamingRelatedQuestions;
    }
    // 否则查找最后一条 assistant 消息的相关问题
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].relatedQuestions?.length) {
        return messages[i].relatedQuestions;
      }
    }
    return [];
  }, [messages, streamingRelatedQuestions]);

  // 发送消息（流式）
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      // 立即添加用户消息到界面
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 初始化流式状态，清空之前的相关问题
      setStreaming(true);
      resetStreamContent();
      setStreamingRelatedQuestions([]);

      // 流式发送消息
      let fullContent = '';
      try {
        for await (const chunk of chatApi.sendMessageStream(
          conversationId,
          content,
          // onChunk 回调：处理聊天内容
          (textChunk) => {
            appendStreamContent(textChunk);
            fullContent += textChunk;
          },
          // onRelatedQuestions 回调：处理相关问题
          (questions) => {
            setStreamingRelatedQuestions(questions);
          },
        )) {
          // chunk 已经在回调中处理
          if (chunk.type === 'content') {
            // 内容已在 onChunk 回调中处理
          }
        }

        // 流式完成后，添加AI回复消息（包含相关问题）
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          relatedQuestions:
            streamingRelatedQuestions.length > 0 ? streamingRelatedQuestions : undefined,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // 重置流式状态
        setStreaming(false);
        resetStreamContent();

        // 刷新对话列表和当前对话
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });

        return { success: true };
      } catch (error) {
        setStreaming(false);
        resetStreamContent();
        setStreamingRelatedQuestions([]);
        throw error;
      }
    },
    onError: (error: unknown) => {
      const err = error as Error;
      toast({
        variant: 'destructive',
        title: '发送失败',
        description: err.message || '请稍后再试',
      });
      setStreaming(false);
      resetStreamContent();
      setStreamingRelatedQuestions([]);
    },
  });

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // 处理发送
  const handleSend = useCallback(() => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input.trim());
    setInput('');
  }, [input, sendMessage]);

  // 处理点击相关问题
  const handleRelatedQuestionClick = useCallback(
    (question: string) => {
      if (sendMessage.isPending) return;
      setStreamingRelatedQuestions([]); // 清空相关问题
      sendMessage.mutate(question);
    },
    [sendMessage],
  );

  // 重新回答：只替换当前 AI 回答，不删除用户问题
  const handleRegenerate = useCallback(
    async (assistantMessageId: string) => {
      if (sendMessage.isPending || isStreaming || !conversationId) return;

      // 找到该 AI 回答的索引
      const assistantIndex = messages.findIndex((m) => m.id === assistantMessageId);
      if (assistantIndex === -1) return;

      // 找到该 AI 回答前面最近的用户消息
      let userMessage: Message | null = null;
      for (let i = assistantIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userMessage = messages[i];
          break;
        }
      }

      if (!userMessage) {
        toast({
          variant: 'destructive',
          title: '重新回答失败',
          description: '找不到对应的用户问题',
        });
        return;
      }

      // 移除当前 AI 回答（保留用户问题）
      setMessages((prev) => prev.filter((_, index) => index !== assistantIndex));
      setStreamingRelatedQuestions([]);

      // 开始流式请求新的回答
      setStreaming(true);
      resetStreamContent();

      let fullContent = '';
      try {
        for await (const chunk of chatApi.sendMessageStream(
          conversationId,
          userMessage.content,
          (textChunk) => {
            appendStreamContent(textChunk);
            fullContent += textChunk;
          },
          (questions) => {
            setStreamingRelatedQuestions(questions);
          },
        )) {
          if (chunk.type === 'content') {
            // 内容已在回调中处理
          }
        }

        // 流式完成后，添加新的 AI 回复
        const newAssistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          relatedQuestions:
            streamingRelatedQuestions.length > 0 ? streamingRelatedQuestions : undefined,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newAssistantMessage]);

        setStreaming(false);
        resetStreamContent();

        // 刷新对话
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      } catch (error) {
        setStreaming(false);
        resetStreamContent();
        setStreamingRelatedQuestions([]);
        const err = error as Error;
        toast({
          variant: 'destructive',
          title: '重新回答失败',
          description: err.message || '请稍后再试',
        });
      }
    },
    [
      messages,
      conversationId,
      sendMessage.isPending,
      isStreaming,
      toast,
      setStreaming,
      resetStreamContent,
      appendStreamContent,
      queryClient,
      streamingRelatedQuestions,
    ],
  );

  // 新建对话
  const handleNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  return (
    <div className="flex h-full flex-col">
      {/* 顶部助手信息栏 - 非默认助手才显示 */}
      {assistant && !assistant.isDefault && (
        <div className="border-b border-border bg-card/50 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold">{assistant.name}</div>
              {assistant.description && (
                <div className="text-xs text-muted-foreground">{assistant.description}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingConversation ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !currentConversation ? (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="mb-4 text-muted-foreground">对话不存在或已被删除</p>
            <Button onClick={handleNewChat}>返回对话列表</Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">开始对话</h2>
            <p className="max-w-md text-muted-foreground">
              我是你的AI助手，可以帮助你解答问题、写作、编程等。
              <br />
              输入你的问题开始对话吧！
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <AnimatePresence>
              {messages.map((message, msgIndex) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn('group/message', message.role === 'user' ? 'flex justify-end' : '')}
                >
                  {message.role === 'user' ? (
                    // 用户消息：复制按钮在左侧，同一行
                    <div className="flex items-center gap-2">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0 rounded-full opacity-0 transition-all duration-200 hover:bg-muted group-hover/message:opacity-100"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>复制内容</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                        <MarkdownRenderer
                          content={message.content}
                          className="text-primary-foreground"
                        />
                      </div>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  ) : (
                    // AI消息：复制和重新回答按钮在下方
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="max-w-[80%]">
                        <div className="rounded-2xl bg-muted px-4 py-3">
                          <MarkdownRenderer content={message.content} />
                        </div>
                        {/* 复制和重新回答按钮在答案下方 */}
                        <div className="mt-1 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover/message:opacity-100">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full hover:bg-muted"
                                  onClick={() => handleCopyMessage(message.id, message.content)}
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>复制内容</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full hover:bg-muted"
                                  onClick={() => handleRegenerate(message.id)}
                                  disabled={sendMessage.isPending || isStreaming}
                                >
                                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>重新回答</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* 每条 AI 消息的相关问题（仅显示该消息是最后一条时） */}
                        {message.relatedQuestions &&
                          message.relatedQuestions.length > 0 &&
                          msgIndex === messages.length - 1 &&
                          !isStreaming && (
                            <div className="mt-4">
                              <div className="mb-3 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  相关问题
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {message.relatedQuestions.map((question, index) => (
                                  <motion.button
                                    key={question}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05, duration: 0.15 }}
                                    onClick={() => handleRelatedQuestionClick(question)}
                                    disabled={sendMessage.isPending}
                                    className={cn(
                                      'group flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm transition-all',
                                      'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm',
                                      'disabled:cursor-not-allowed disabled:opacity-50',
                                    )}
                                  >
                                    <span className="text-muted-foreground group-hover:text-foreground">
                                      {question}
                                    </span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 流式响应显示 */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group/message flex gap-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[80%]">
                  <div className="rounded-2xl bg-muted px-4 py-3">
                    {streamingContent ? (
                      <div className="relative">
                        <MarkdownRenderer content={streamingContent} />
                        <span className="typing-cursor ml-1" />
                      </div>
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* 复制按钮在答案下方 - 仅在有内容时显示 */}
                  {streamingContent && (
                    <div className="mt-1 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover/message:opacity-100">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full hover:bg-muted"
                              onClick={() => handleCopyMessage('streaming', streamingContent)}
                            >
                              {copiedMessageId === 'streaming' ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>复制内容</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 加载中指示器 - 仅在流式响应开始前显示 */}
            {sendMessage.isPending && !isStreaming && !streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start gap-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-muted px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}

            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />

            {/* 流式响应结束后的相关问题推荐 */}
            <AnimatePresence mode="wait">
              {streamingRelatedQuestions.length > 0 && !isStreaming && (
                <motion.div
                  key="related-questions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-muted-foreground">相关问题</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {streamingRelatedQuestions.map((question, index) => (
                      <motion.button
                        key={question}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.15 }}
                        onClick={() => handleRelatedQuestionClick(question)}
                        disabled={sendMessage.isPending}
                        className={cn(
                          'group flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm transition-all',
                          'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                        )}
                      >
                        <span className="text-muted-foreground group-hover:text-foreground">
                          {question}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t border-border p-4">
        <div className="mx-auto max-w-3xl">
          <MarkdownEditor
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={sendMessage.isPending}
            isSending={sendMessage.isPending}
            placeholder="输入消息... 支持 Markdown 格式"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI生成的内容仅供参考，请自行判断准确性
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatDetailPage;
