'use client';

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatApi } from '@/lib/api';
import { useChatStore, type Message, type Conversation } from '@/store/chat';
import { useToast } from '@/components/ui/use-toast';
import { useCopyMessage } from '@/hooks/use-copy-message';
import MarkdownEditor from '@/components/chat/markdown-editor';
import UserMessage from '@/components/chat/user-message';
import AssistantMessage from '@/components/chat/assistant-message';
import StreamingMessage from '@/components/chat/streaming-message';
import LoadingIndicator from '@/components/chat/loading-indicator';
import RelatedQuestions from '@/components/chat/related-questions';
import EmptyState from '@/components/chat/empty-state';

const ChatDetailPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isStreaming,
    streamingContent,
    setStreaming,
    appendStreamContent,
    resetStreamContent,
    setAbortController,
    stopGeneration,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  // 使用 ref 存储流式响应中的相关问题，避免闭包问题
  const streamingRelatedQuestionsRef = useRef<string[]>([]);

  const { copiedMessageId, handleCopyMessage } = useCopyMessage();

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

      // 创建 AbortController
      const abortController = new AbortController();
      setAbortController(abortController);

      // 初始化流式状态，清空之前的相关问题
      setStreaming(true);
      resetStreamContent();
      streamingRelatedQuestionsRef.current = [];

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
            streamingRelatedQuestionsRef.current = questions;
          },
          abortController.signal,
        )) {
          // chunk 已经在回调中处理
          if (chunk.type === 'content') {
            // 内容已在 onChunk 回调中处理
          }
        }

        // 流式完成后，添加AI回复消息（包含相关问题）
        // 使用 ref 获取最新的相关问题，避免闭包问题
        const finalRelatedQuestions = streamingRelatedQuestionsRef.current;
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          relatedQuestions: finalRelatedQuestions.length > 0 ? finalRelatedQuestions : undefined,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // 重置流式状态，清空临时相关问题
        setStreaming(false);
        resetStreamContent();
        setAbortController(null);
        streamingRelatedQuestionsRef.current = [];

        // 刷新对话列表（不刷新当前对话，避免重绘）
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        return { success: true };
      } catch (error) {
        // 检查是否是用户主动中止
        if (error instanceof Error && error.name === 'AbortError') {
          // 用户停止生成，保存已生成的内容
          // 优先使用 fullContent，如果为空则使用 store 中的 streamingContent
          const contentToSave = fullContent || useChatStore.getState().streamingContent;
          if (contentToSave) {
            // 保存到服务器
            try {
              await chatApi.savePartialMessage(conversationId, contentToSave);
            } catch {
              // 保存失败时静默处理
              console.error('Failed to save partial message');
            }

            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: contentToSave,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
          setStreaming(false);
          resetStreamContent();
          setAbortController(null);
          streamingRelatedQuestionsRef.current = [];

          // 刷新对话列表和当前对话
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });

          return { success: true, stopped: true };
        }
        setStreaming(false);
        resetStreamContent();
        setAbortController(null);
        streamingRelatedQuestionsRef.current = [];
        throw error;
      }
    },
    onError: (error: unknown) => {
      const err = error as Error;
      // 不显示中止错误
      if (err.name !== 'AbortError') {
        toast({
          variant: 'destructive',
          title: '发送失败',
          description: err.message || '请稍后再试',
        });
      }
      setStreaming(false);
      resetStreamContent();
      setAbortController(null);
      streamingRelatedQuestionsRef.current = [];
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
      streamingRelatedQuestionsRef.current = []; // 清空相关问题
      sendMessage.mutate(question);
    },
    [sendMessage],
  );

  // 编辑消息：编辑用户消息后重新生成 AI 回复
  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (sendMessage.isPending || isStreaming || !conversationId) return;

      // 找到要编辑的消息
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // 更新消息内容并删除之后的消息
      setMessages((prev) => {
        const newMessages = prev.slice(0, messageIndex);
        newMessages.push({
          ...prev[messageIndex],
          content: newContent,
        });
        return newMessages;
      });
      streamingRelatedQuestionsRef.current = [];

      // 创建 AbortController
      const abortController = new AbortController();
      setAbortController(abortController);

      // 开始流式请求
      setStreaming(true);
      resetStreamContent();

      let fullContent = '';
      try {
        for await (const chunk of chatApi.editMessageStream(
          conversationId,
          messageId,
          newContent,
          (textChunk) => {
            appendStreamContent(textChunk);
            fullContent += textChunk;
          },
          (questions) => {
            streamingRelatedQuestionsRef.current = questions;
          },
          abortController.signal,
        )) {
          if (chunk.type === 'content') {
            // 内容已在回调中处理
          }
        }

        // 流式完成后，添加新的 AI 回复
        const finalRelatedQuestions = streamingRelatedQuestionsRef.current;
        const newAssistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          relatedQuestions: finalRelatedQuestions.length > 0 ? finalRelatedQuestions : undefined,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newAssistantMessage]);

        // 重置流式状态
        setStreaming(false);
        resetStreamContent();
        setAbortController(null);
        streamingRelatedQuestionsRef.current = [];

        // 刷新对话列表
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      } catch (error) {
        // 检查是否是用户主动中止
        if (error instanceof Error && error.name === 'AbortError') {
          const contentToSave = fullContent || useChatStore.getState().streamingContent;
          if (contentToSave) {
            try {
              await chatApi.savePartialMessage(conversationId, contentToSave);
            } catch {
              console.error('Failed to save partial message');
            }

            const newAssistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: contentToSave,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, newAssistantMessage]);
          }
          setStreaming(false);
          resetStreamContent();
          setAbortController(null);
          streamingRelatedQuestionsRef.current = [];

          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
          return;
        }
        setStreaming(false);
        resetStreamContent();
        setAbortController(null);
        streamingRelatedQuestionsRef.current = [];
        const err = error as Error;
        toast({
          variant: 'destructive',
          title: '编辑消息失败',
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
      setAbortController,
      queryClient,
    ],
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
      streamingRelatedQuestionsRef.current = [];

      // 创建 AbortController
      const abortController = new AbortController();
      setAbortController(abortController);

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
            streamingRelatedQuestionsRef.current = questions;
          },
          abortController.signal,
        )) {
          if (chunk.type === 'content') {
            // 内容已在回调中处理
          }
        }

        // 流式完成后，添加新的 AI 回复
        // 使用 ref 获取最新的相关问题
        const finalRelatedQuestions = streamingRelatedQuestionsRef.current;
        const newAssistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          relatedQuestions: finalRelatedQuestions.length > 0 ? finalRelatedQuestions : undefined,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newAssistantMessage]);

        // 重置流式状态，清空临时相关问题
        setStreaming(false);
        resetStreamContent();
        setAbortController(null);
        streamingRelatedQuestionsRef.current = [];

        // 刷新对话列表（不刷新当前对话，避免重绘）
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        // 检查是否是用户主动中止
        if (error instanceof Error && error.name === 'AbortError') {
          // 用户停止生成，保存已生成的内容
          const contentToSave = fullContent || useChatStore.getState().streamingContent;
          if (contentToSave) {
            // 保存到服务器
            try {
              await chatApi.savePartialMessage(conversationId, contentToSave);
            } catch {
              console.error('Failed to save partial message');
            }

            const newAssistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: contentToSave,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, newAssistantMessage]);
          }
          setStreaming(false);
          resetStreamContent();
          setAbortController(null);
          streamingRelatedQuestionsRef.current = [];

          // 刷新对话列表和当前对话
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
          return;
        }
        setStreaming(false);
        resetStreamContent();
        setAbortController(null);
        streamingRelatedQuestionsRef.current = [];
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
      setAbortController,
      queryClient,
    ],
  );

  // 新建对话
  const handleNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  // 获取最后一条消息的相关问题
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageRelatedQuestions =
    lastMessage?.role === 'assistant' && lastMessage.relatedQuestions
      ? lastMessage.relatedQuestions
      : [];

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
          <EmptyState title="开始对话" />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <AnimatePresence>
              {messages.map((message, msgIndex) =>
                message.role === 'user' ? (
                  <UserMessage
                    key={message.id}
                    message={message}
                    copiedMessageId={copiedMessageId}
                    onCopy={handleCopyMessage}
                    onEdit={handleEditMessage}
                    isEditDisabled={sendMessage.isPending || isStreaming}
                  />
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    copiedMessageId={copiedMessageId}
                    onCopy={handleCopyMessage}
                    onRegenerate={handleRegenerate}
                    isRegenerateDisabled={sendMessage.isPending || isStreaming}
                  >
                    {/* 每条 AI 消息的相关问题（仅显示该消息是最后一条时） */}
                    {message.relatedQuestions &&
                      message.relatedQuestions.length > 0 &&
                      msgIndex === messages.length - 1 && (
                        <RelatedQuestions
                          questions={message.relatedQuestions}
                          onQuestionClick={handleRelatedQuestionClick}
                          disabled={sendMessage.isPending}
                          show={!isStreaming}
                        />
                      )}
                  </AssistantMessage>
                ),
              )}
            </AnimatePresence>

            {/* 流式响应显示 */}
            {isStreaming && (
              <StreamingMessage
                content={streamingContent}
                copiedMessageId={copiedMessageId}
                onCopy={handleCopyMessage}
              />
            )}

            {/* 加载中指示器 - 仅在流式响应开始前显示 */}
            {sendMessage.isPending && !isStreaming && !streamingContent && <LoadingIndicator />}

            {/* 滚动锚点 */}
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
            onStop={stopGeneration}
            disabled={sendMessage.isPending && !isStreaming}
            isSending={sendMessage.isPending && !isStreaming}
            isStreaming={isStreaming}
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
