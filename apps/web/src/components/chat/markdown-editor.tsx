'use client';

import type { FC } from 'react';
import { useState, useRef, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Eye,
  EyeOff,
  Send,
  Loader2,
} from 'lucide-react';
import MarkdownRenderer from './markdown-renderer';

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
  const [showPreview, setShowPreview] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 插入文本到光标位置
  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      value.substring(0, start) + 
      before + 
      textToInsert + 
      after + 
      value.substring(end);
    
    onChange(newText);
    
    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  // 工具栏按钮操作
  const actions = [
    {
      icon: Bold,
      label: '粗体',
      action: () => insertText('**', '**', '粗体文本'),
    },
    {
      icon: Italic,
      label: '斜体',
      action: () => insertText('*', '*', '斜体文本'),
    },
    {
      icon: Code,
      label: '行内代码',
      action: () => insertText('`', '`', '代码'),
    },
    {
      icon: Heading1,
      label: '一级标题',
      action: () => insertText('\n# ', '', '标题'),
    },
    {
      icon: Heading2,
      label: '二级标题',
      action: () => insertText('\n## ', '', '标题'),
    },
    {
      icon: List,
      label: '无序列表',
      action: () => insertText('\n- ', '', '列表项'),
    },
    {
      icon: ListOrdered,
      label: '有序列表',
      action: () => insertText('\n1. ', '', '列表项'),
    },
    {
      icon: Quote,
      label: '引用',
      action: () => insertText('\n> ', '', '引用内容'),
    },
    {
      icon: LinkIcon,
      label: '链接',
      action: () => insertText('[', '](url)', '链接文本'),
    },
    {
      icon: ImageIcon,
      label: '图片',
      action: () => insertText('![', '](url)', '图片描述'),
    },
    {
      icon: Table,
      label: '表格',
      action: () => insertText(
        '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |\n',
        '',
        ''
      ),
    },
  ];

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
    if (e.key === 'Enter' && !e.shiftKey && !showPreview && !isComposing) {
      e.preventDefault();
      if (!disabled && !isSending && value.trim()) {
        onSend();
      }
    }

    // 支持 Tab 键缩进
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ', '', '');
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card/50 p-2">
        <div className="flex flex-wrap gap-1">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={action.action}
              disabled={disabled || showPreview}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="text-xs">编辑</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="text-xs">预览</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 编辑/预览区域 */}
      <div className="relative">
        {showPreview ? (
          <div className="min-h-[120px] max-h-[300px] overflow-y-auto rounded-lg border border-border bg-card p-4">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <div className="text-sm text-muted-foreground">暂无内容预览</div>
            )}
          </div>
        ) : (
          <>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={placeholder}
              className="min-h-[120px] max-h-[300px] resize-none pr-14 font-mono text-sm"
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
          </>
        )}
      </div>

      {/* 提示信息 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>支持 Markdown 格式 | Enter 发送，Shift+Enter 换行</span>
        <span>{value.length} 字符</span>
      </div>
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;

