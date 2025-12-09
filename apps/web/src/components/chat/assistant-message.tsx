'use client';

import type { FC, ReactNode } from 'react';
import { memo } from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Message } from '@/store/chat';
import MarkdownRenderer from '@/components/chat/markdown-renderer';
import CopyButton from '@/components/chat/copy-button';

interface AssistantMessageProps {
  message: Message;
  copiedMessageId: string | null;
  onCopy: (messageId: string, content: string) => void;
  onRegenerate?: (messageId: string) => void;
  isRegenerateDisabled?: boolean;
  children?: ReactNode; // 用于渲染相关问题等附加内容
}

const AssistantMessage: FC<AssistantMessageProps> = memo(
  ({ message, copiedMessageId, onCopy, onRegenerate, isRegenerateDisabled, children }) => {
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="group/message"
      >
        <div className="flex gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="max-w-[80%]">
            <div className="rounded-2xl bg-muted px-4 py-3">
              <MarkdownRenderer content={message.content} />
            </div>
            {/* 操作按钮 */}
            <div className="mt-1 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover/message:opacity-100">
              <CopyButton
                messageId={message.id}
                content={message.content}
                copiedMessageId={copiedMessageId}
                onCopy={onCopy}
              />
              {onRegenerate && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-muted"
                        onClick={() => onRegenerate(message.id)}
                        disabled={isRegenerateDisabled}
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>重新回答</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {/* 附加内容（如相关问题） */}
            {children}
          </div>
        </div>
      </motion.div>
    );
  },
);

AssistantMessage.displayName = 'AssistantMessage';

export default AssistantMessage;
