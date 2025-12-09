'use client';

import type { FC } from 'react';
import { memo } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CopyButtonProps {
  messageId: string;
  content: string;
  copiedMessageId: string | null;
  onCopy: (messageId: string, content: string) => void;
  className?: string;
}

const CopyButton: FC<CopyButtonProps> = memo(
  ({ messageId, content, copiedMessageId, onCopy, className = '' }) => {
    const isCopied = copiedMessageId === messageId;

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full hover:bg-muted ${className}`}
              onClick={() => onCopy(messageId, content)}
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>复制内容</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

CopyButton.displayName = 'CopyButton';

export default CopyButton;
