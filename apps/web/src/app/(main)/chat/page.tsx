'use client';

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { chatApi } from '@/lib/api';
import { useChatStore, type Message, type Conversation } from '@/store/chat';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // 获取对话列表
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

  // 更新消息列表
  useEffect(() => {
    if (currentConversation?.messages) {
      setMessages(currentConversation.messages);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  // 创建新对话
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
      }

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

      // 流式发送消息
      let fullContent = '';
      try {
        for await (const chunk of chatApi.sendMessageStream(convId, content, (chunk) => {
          appendStreamContent(chunk);
          fullContent += chunk;
        })) {
          // chunk已经在onChunk回调中处理
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
  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input.trim());
    setInput('');
    textareaRef.current?.focus();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      {/* 对话列表侧边栏 */}
      <div className="w-72 border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border">
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

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors',
                currentConversationId === conv.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent'
              )}
              onClick={() => setCurrentConversation(conv.id)}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">
                {conv.title || '新对话'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="text-center text-muted-foreground text-sm py-8">
              暂无对话记录
            </div>
          )}
        </div>
      </div>

      {/* 聊天主区域 */}
      <div className="flex-1 flex flex-col">
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !loadingConversation ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">开始新对话</h2>
              <p className="text-muted-foreground max-w-md">
                我是你的AI助手，可以帮助你解答问题、写作、编程等。
                <br />
                输入你的问题开始对话吧！
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
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
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
                    {streamingContent ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamingContent}
                        </ReactMarkdown>
                        <span className="typing-cursor" />
                      </div>
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </motion.div>
              )}

              {/* 加载中指示器 - 仅在流式响应开始前显示 */}
              {sendMessage.isPending && !isStreaming && !streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息... (Enter发送, Shift+Enter换行)"
                className="min-h-[56px] max-h-[200px] pr-14 resize-none"
                disabled={sendMessage.isPending}
              />
              <Button
                size="icon"
                className="absolute right-2 bottom-2"
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI生成的内容仅供参考，请自行判断准确性
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

