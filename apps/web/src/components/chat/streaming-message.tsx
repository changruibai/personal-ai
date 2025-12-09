'use client';

import type { FC } from 'react';
import { memo } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import MarkdownRenderer from '@/components/chat/markdown-renderer';
import CopyButton from '@/components/chat/copy-button';

interface StreamingMessageProps {
  content: string;
  copiedMessageId: string | null;
  onCopy: (messageId: string, content: string) => void;
}

const StreamingMessage: FC<StreamingMessageProps> = memo(({ content, copiedMessageId, onCopy }) => {
  return (
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
          {content ? (
            <div className="relative">
              <MarkdownRenderer content={content} />
              <span className="typing-cursor ml-1" />
            </div>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* 复制按钮 - 仅在有内容时显示 */}
        {content && (
          <div className="mt-1 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover/message:opacity-100">
            <CopyButton
              messageId="streaming"
              content={content}
              copiedMessageId={copiedMessageId}
              onCopy={onCopy}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
});

StreamingMessage.displayName = 'StreamingMessage';

export default StreamingMessage;
