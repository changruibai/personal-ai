'use client';

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Loader2, Lightbulb, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { chatApi } from '@/lib/api';
import { useChatStore, type Message } from '@/store/chat';
import { useToast } from '@/components/ui/use-toast';
import MarkdownRenderer from '@/components/chat/markdown-renderer';
import MarkdownEditor from '@/components/chat/markdown-editor';

const ChatPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isStreaming, streamingContent, setStreaming, appendStreamContent, resetStreamContent } =
    useChatStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
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

  // 发送消息（流式） - 新对话
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      // 先创建一个新对话
      const res = await chatApi.createConversation({});
      const convId = res.data.id;

      // 立即刷新对话列表
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // 立即添加用户消息到界面
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 初始化流式状态
      setStreaming(true);
      resetStreamContent();
      setStreamingRelatedQuestions([]);

      // 流式发送消息
      let fullContent = '';
      try {
        for await (const chunk of chatApi.sendMessageStream(
          convId,
          content,
          (textChunk) => {
            appendStreamContent(textChunk);
            fullContent += textChunk;
          },
          (questions) => {
            setStreamingRelatedQuestions(questions);
          },
        )) {
          // chunk 已经在回调中处理
        }

        // 流式完成后，添加AI回复消息
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

        // 刷新对话列表
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        // 跳转到新创建的对话页面
        router.push(`/chat/${convId}`);

        return { success: true, conversationId: convId };
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
      setStreamingRelatedQuestions([]);
      sendMessage.mutate(question);
    },
    [sendMessage],
  );

  return (
    <div className="flex h-full flex-col">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">开始新对话</h2>
            <p className="max-w-md text-muted-foreground">
              我是你的AI助手，可以帮助你解答问题、写作、编程等。
              <br />
              输入你的问题开始对话吧！
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn('group/message', message.role === 'user' ? 'flex justify-end' : '')}
                >
                  {message.role === 'user' ? (
                    // 用户消息
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
                    // AI消息
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="max-w-[80%]">
                        <div className="rounded-2xl bg-muted px-4 py-3">
                          <MarkdownRenderer content={message.content} />
                        </div>
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
                        </div>
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

            {/* 加载中指示器 */}
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

            {/* 相关问题推荐 */}
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
      <div className="p-4">
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

export default ChatPage;
