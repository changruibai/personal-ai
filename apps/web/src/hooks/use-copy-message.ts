'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useCopyMessage() {
  const { toast } = useToast();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedMessageId(messageId);
        toast({
          title: '已复制到剪贴板',
          duration: 2000,
        });
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch {
        toast({
          variant: 'destructive',
          title: '复制失败',
          description: '请手动选择文本复制',
        });
      }
    },
    [toast],
  );

  return {
    copiedMessageId,
    handleCopyMessage,
  };
}
