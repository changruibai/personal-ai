'use client';

import type { FC } from 'react';
import { memo } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LoadingIndicator: FC = memo(() => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start gap-3"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl bg-muted px-4 py-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    </motion.div>
  );
});

LoadingIndicator.displayName = 'LoadingIndicator';

export default LoadingIndicator;
