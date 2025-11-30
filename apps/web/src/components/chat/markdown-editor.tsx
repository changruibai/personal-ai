'use client';

import type { FC } from 'react';
import { useState, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, Loader2 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSending?: boolean;
  className?: string;
}

const MarkdownEditor: FC<MarkdownEditorProps> = memo(({
  value,
  onChange,
  onSend,
  placeholder = '输入消息... 支持 Markdown 格式',
  disabled = false,
  isSending = false,
  className,
}) => {
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 处理输入法开始
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  // 处理输入法结束
  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果正在使用输入法，不处理 Enter 键
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      if (!disabled && !isSending && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        className="min-h-[120px] max-h-[300px] resize-none pr-14"
        disabled={disabled}
      />
      <Button
        size="icon"
        className="absolute bottom-2 right-2"
        onClick={onSend}
        disabled={!value.trim() || disabled || isSending}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;

