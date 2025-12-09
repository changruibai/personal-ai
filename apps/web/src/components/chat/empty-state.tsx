'use client';

import type { FC } from 'react';
import { memo } from 'react';
import { Bot } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState: FC<EmptyStateProps> = memo(
  ({
    title = '开始新对话',
    description = '我是你的AI助手，可以帮助你解答问题、写作、编程等。\n输入你的问题开始对话吧！',
  }) => {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">{title}</h2>
        <p className="max-w-md text-muted-foreground">
          {description.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < description.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
