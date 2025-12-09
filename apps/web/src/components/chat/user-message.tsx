'use client';

import type { FC } from 'react';
import { memo } from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Message } from '@/store/chat';
import MarkdownRenderer from '@/components/chat/markdown-renderer';
import CopyButton from '@/components/chat/copy-button';

interface UserMessageProps {
  message: Message;
  copiedMessageId: string | null;
  onCopy: (messageId: string, content: string) => void;
}

const UserMessage: FC<UserMessageProps> = memo(({ message, copiedMessageId, onCopy }) => {
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="group/message flex justify-end"
    >
      <div className="flex items-center gap-2">
        <CopyButton
          messageId={message.id}
          content={message.content}
          copiedMessageId={copiedMessageId}
          onCopy={onCopy}
          className="flex-shrink-0 opacity-0 transition-all duration-200 group-hover/message:opacity-100"
        />
        <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
          <MarkdownRenderer content={message.content} className="text-primary-foreground" />
        </div>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
    </motion.div>
  );
});

UserMessage.displayName = 'UserMessage';

export default UserMessage;
