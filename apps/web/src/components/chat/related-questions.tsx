'use client';

import type { FC } from 'react';
import { memo } from 'react';
import { Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RelatedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
  show?: boolean;
}

const RelatedQuestions: FC<RelatedQuestionsProps> = memo(
  ({ questions, onQuestionClick, disabled, show = true }) => {
    if (!show || questions.length === 0) return null;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="related-questions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-muted-foreground">相关问题</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((question, index) => (
              <motion.button
                key={question}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.15 }}
                onClick={() => onQuestionClick(question)}
                disabled={disabled}
                className={cn(
                  'group flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm transition-all',
                  'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <span className="text-muted-foreground group-hover:text-foreground">{question}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  },
);

RelatedQuestions.displayName = 'RelatedQuestions';

export default RelatedQuestions;
