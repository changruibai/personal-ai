'use client';

import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { chatApi } from '@/lib/api';
import { useChatStore, type Message } from '@/store/chat';
import { useToast } from '@/components/ui/use-toast';
import { useCopyMessage } from '@/hooks/use-copy-message';
import MarkdownEditor from '@/components/chat/markdown-editor';
import UserMessage from '@/components/chat/user-message';
import AssistantMessage from '@/components/chat/assistant-message';
import StreamingMessage from '@/components/chat/streaming-message';
import LoadingIndicator from '@/components/chat/loading-indicator';
import RelatedQuestions from '@/components/chat/related-questions';
import EmptyState from '@/components/chat/empty-state';

const ChatPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
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
  const [streamingRelatedQuestions, setStreamingRelatedQuestions] = useState<string[]>([]);

  const { copiedMessageId, handleCopyMessage } = useCopyMessage();

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

      // 创建 AbortController
      const abortController = new AbortController();
      setAbortController(abortController);

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
          abortController.signal,
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
        setAbortController(null);

        // 刷新对话列表
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        // 跳转到新创建的对话页面
        router.push(`/chat/${convId}`);

        return { success: true, conversationId: convId };
      } catch (error) {
        // 检查是否是用户主动中止
        if (error instanceof Error && error.name === 'AbortError') {
          // 用户停止生成，保存已生成的内容
          // 优先使用 fullContent，如果为空则使用 store 中的 streamingContent
          const contentToSave = fullContent || useChatStore.getState().streamingContent;
          if (contentToSave) {
            // 保存到服务器
            try {
              await chatApi.savePartialMessage(convId, contentToSave);
            } catch {
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

          // 刷新对话列表
          queryClient.invalidateQueries({ queryKey: ['conversations'] });

          // 跳转到新创建的对话页面
          router.push(`/chat/${convId}`);

          return { success: true, conversationId: convId, stopped: true };
        }
        setStreaming(false);
        resetStreamContent();
        setAbortController(null);
        setStreamingRelatedQuestions([]);
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
          <EmptyState />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <AnimatePresence>
              {messages.map((message) =>
                message.role === 'user' ? (
                  <UserMessage
                    key={message.id}
                    message={message}
                    copiedMessageId={copiedMessageId}
                    onCopy={handleCopyMessage}
                  />
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    copiedMessageId={copiedMessageId}
                    onCopy={handleCopyMessage}
                  />
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

            {/* 加载中指示器 */}
            {sendMessage.isPending && !isStreaming && !streamingContent && <LoadingIndicator />}

            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />

            {/* 相关问题推荐 */}
            <RelatedQuestions
              questions={streamingRelatedQuestions}
              onQuestionClick={handleRelatedQuestionClick}
              disabled={sendMessage.isPending}
              show={!isStreaming}
            />
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

export default ChatPage;
