'use client';

import type { FC, KeyboardEvent } from 'react';
import { memo, useState, useRef, useEffect } from 'react';
import { User, Pencil, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Message } from '@/store/chat';
import MarkdownRenderer from '@/components/chat/markdown-renderer';
import CopyButton from '@/components/chat/copy-button';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserMessageProps {
  message: Message;
  copiedMessageId: string | null;
  onCopy: (messageId: string, content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  isEditDisabled?: boolean;
}

const UserMessage: FC<UserMessageProps> = memo(
  ({ message, copiedMessageId, onCopy, onEdit, isEditDisabled }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 进入编辑模式时聚焦输入框
    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        // 将光标移到末尾
        textareaRef.current.setSelectionRange(editContent.length, editContent.length);
      }
    }, [isEditing, editContent.length]);

    const handleStartEdit = () => {
      setEditContent(message.content);
      setIsEditing(true);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditContent(message.content);
    };

    const handleConfirmEdit = () => {
      if (editContent.trim() && editContent.trim() !== message.content) {
        onEdit?.(message.id, editContent.trim());
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirmEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    };

    if (isEditing) {
      return (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex justify-end"
        >
          <div className="flex w-full max-w-[80%] flex-col gap-2">
            <Textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
              placeholder="输入消息..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="mr-1 h-3.5 w-3.5" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmEdit}
                disabled={!editContent.trim() || editContent.trim() === message.content}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                确认
              </Button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="group/message flex justify-end"
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-all duration-200 group-hover/message:opacity-100">
            {onEdit && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-muted"
                      onClick={handleStartEdit}
                      disabled={isEditDisabled}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>编辑消息</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <CopyButton
              messageId={message.id}
              content={message.content}
              copiedMessageId={copiedMessageId}
              onCopy={onCopy}
            />
          </div>
          <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
            <MarkdownRenderer content={message.content} className="text-primary-foreground" />
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </motion.div>
    );
  },
);

UserMessage.displayName = 'UserMessage';

export default UserMessage;
