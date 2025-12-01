'use client';

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Loader2, MessageSquare, Trash2, Plus, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { chatApi } from '@/lib/api';
import { useChatStore, type Message, type Conversation } from '@/store/chat';
import { useToast } from '@/components/ui/use-toast';
import MarkdownRenderer from '@/components/chat/markdown-renderer';
import MarkdownEditor from '@/components/chat/markdown-editor';

const ChatPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const {
    currentConversationId,
    setCurrentConversation,
    isStreaming,
    streamingContent,
    setStreaming,
    appendStreamContent,
    resetStreamContent,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);

  // 从 URL 参数中读取对话 ID
  useEffect(() => {
    const id = searchParams?.get('id');
    if (id) {
      setCurrentConversation(id);
    }
  }, [searchParams, setCurrentConversation]);

  // 获取对话列表（由于 React Query 缓存，如果 Sidebar 已请求过，这里会直接使用缓存）
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatApi.getConversations();
      return res.data;
    },
  });

  // 获取当前对话详情
  const { data: currentConversation, isLoading: loadingConversation } = useQuery<Conversation>({
    queryKey: ['conversation', currentConversationId],
    queryFn: async () => {
      if (!currentConversationId) return null;
      const res = await chatApi.getConversation(currentConversationId);
      return res.data;
    },
    enabled: !!currentConversationId,
  });

  // 优化：直接从对话数据中获取 assistant 信息，不需要额外请求
  const assistant = currentConversation?.assistant;

  // 更新消息列表
  useEffect(() => {
    if (currentConversation?.messages) {
      setMessages(currentConversation.messages);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  // 创建新对话
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createConversation = useMutation({
    mutationFn: () => chatApi.createConversation({}),
    onSuccess: (res) => {
      setCurrentConversation(res.data.id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // 发送消息（流式）
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      let convId = currentConversationId;

      // 如果没有当前对话，先创建一个
      if (!convId) {
        const res = await chatApi.createConversation({});
        convId = res.data.id;
        setCurrentConversation(convId);
        // 立即刷新对话列表，让左侧历史会话显示新对话
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }

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
      setRelatedQuestions([]);

      // 流式发送消息
      let fullContent = '';
      try {
        for await (const chunk of chatApi.sendMessageStream(
          convId ?? '',
          content,
          // onChunk 回调：处理聊天内容
          (textChunk) => {
            appendStreamContent(textChunk);
            fullContent += textChunk;
          },
          // onRelatedQuestions 回调：处理相关问题
          (questions) => {
            setRelatedQuestions(questions);
          },
        )) {
          // chunk 已经在回调中处理
          if (chunk.type === 'content') {
            // 内容已在 onChunk 回调中处理
          }
        }

        // 流式完成后，添加AI回复消息
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // 重置流式状态
        setStreaming(false);
        resetStreamContent();

        // 刷新对话列表和当前对话
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['conversation', convId] });

        return { success: true };
      } catch (error) {
        setStreaming(false);
        resetStreamContent();
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
    },
  });

  // 删除对话
  const deleteConversation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => {
      if (currentConversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ title: '对话已删除' });
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
      setRelatedQuestions([]); // 清空相关问题
      sendMessage.mutate(question);
    },
    [sendMessage],
  );

  return (
    <div className="flex h-full">
      {/* 对话列表侧边栏 */}
      <div className="flex w-80 flex-col border-r border-border bg-card/30">
        <div className="border-b border-border p-4">
          <Button
            className="w-full gap-2"
            onClick={() => {
              setCurrentConversation(null);
              setMessages([]);
            }}
          >
            <Plus className="h-4 w-4" />
            新对话
          </Button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors',
                currentConversationId === conv.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent',
              )}
              onClick={() => setCurrentConversation(conv.id)}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{conv.title || '新对话'}</span>
                {/* 非默认助手才显示助手名称 */}
                {conv.assistant && !conv.assistant.isDefault && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {conv.assistant.name}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation.mutate(conv.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无对话记录</div>
          )}
        </div>
      </div>

      {/* 聊天主区域 */}
      <div className="flex flex-1 flex-col">
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
          {messages.length === 0 && !loadingConversation ? (
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
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <MarkdownRenderer
                          content={message.content}
                          className="text-primary-foreground"
                        />
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                        <User className="h-4 w-4 text-primary-foreground" />
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
                  className="flex justify-start gap-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3">
                    {streamingContent ? (
                      <div className="relative">
                        <MarkdownRenderer content={streamingContent} />
                        <span className="typing-cursor ml-1" />
                      </div>
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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

              {/* 相关问题推荐 */}
              {relatedQuestions.length > 0 && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-muted-foreground">相关问题</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {relatedQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
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

              <div ref={messagesEndRef} />
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
    </div>
  );
};

export default ChatPage;
