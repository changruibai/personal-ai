'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DiagnosisResult } from '@/app/(main)/resume/page';

interface ResumeDiagnosisStepProps {
  diagnosis: DiagnosisResult;
  resumeContent: string;
  onContinue: () => void;
}

// 评分等级配置
const getScoreGrade = (score: number) => {
  if (score >= 85) {
    return {
      label: '优秀',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500',
      ringColor: 'ring-emerald-500/20',
      description: '您的简历整体质量很高，稍加优化即可更加出色',
    };
  }
  if (score >= 70) {
    return {
      label: '良好',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      ringColor: 'ring-blue-500/20',
      description: '您的简历基础不错，有一些可以改进的地方',
    };
  }
  if (score >= 50) {
    return {
      label: '一般',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
      ringColor: 'ring-amber-500/20',
      description: '您的简历需要较多优化，建议按照建议逐项改进',
    };
  }
  return {
    label: '需改进',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    ringColor: 'ring-red-500/20',
    description: '您的简历存在较多问题，AI优化可以帮助您大幅提升',
  };
};

// 优先级配置
const priorityConfig = {
  high: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-900',
    label: '高优先',
  },
  medium: {
    icon: Info,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-900',
    label: '中优先',
  },
  low: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-900',
    label: '建议',
  },
};

export const ResumeDiagnosisStep: React.FC<ResumeDiagnosisStepProps> = ({
  diagnosis,
  resumeContent,
  onContinue,
}) => {
  const scoreGrade = useMemo(() => getScoreGrade(diagnosis.score), [diagnosis.score]);

  // 统计各优先级的数量
  const priorityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    diagnosis.improvements.forEach((item) => {
      counts[item.priority]++;
    });
    return counts;
  }, [diagnosis.improvements]);

  // 计算简历字数
  const wordCount = useMemo(() => {
    return resumeContent.replace(/\s/g, '').length;
  }, [resumeContent]);

  return (
    <div className="space-y-6">
      {/* 评分卡片 */}
      <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 p-6 sm:flex-row sm:items-start sm:gap-8">
        {/* 分数圆环 */}
        <div className="relative mb-4 sm:mb-0">
          <svg className="h-32 w-32 -rotate-90 transform">
            {/* 背景圆环 */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted"
            />
            {/* 进度圆环 */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={`${(diagnosis.score / 100) * 352} 352`}
              strokeLinecap="round"
              className={scoreGrade.color}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-3xl font-bold', scoreGrade.color)}>
              {diagnosis.score}
            </span>
            <span className="text-sm text-muted-foreground">分</span>
          </div>
        </div>

        {/* 评分详情 */}
        <div className="flex-1 text-center sm:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium',
                scoreGrade.bgColor,
                'text-white'
              )}
            >
              {scoreGrade.label}
            </span>
          </div>
          <p className="mb-4 text-muted-foreground">{scoreGrade.description}</p>
          <div className="text-sm text-muted-foreground">{diagnosis.overall}</div>

          {/* 统计信息 */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
            <div className="flex items-center gap-1.5 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{wordCount} 字</span>
            </div>
            {priorityCounts.high > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <span>{priorityCounts.high} 个重要问题</span>
              </div>
            )}
            {priorityCounts.medium > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-amber-500">
                <Info className="h-4 w-4" />
                <span>{priorityCounts.medium} 个改进点</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 改进建议列表 */}
      {diagnosis.improvements.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            改进建议
          </h3>
          <div className="space-y-2">
            {diagnosis.improvements.map((item, index) => {
              const config = priorityConfig[item.priority];
              const Icon = config.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', config.color)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.section}</span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs',
                          config.color,
                          'bg-white/50 dark:bg-black/20'
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.suggestion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 建议关键词 */}
      {diagnosis.keywords.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            建议添加的关键词
          </h3>
          <div className="flex flex-wrap gap-2">
            {diagnosis.keywords.map((keyword, index) => (
              <span
                key={index}
                className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 继续按钮 */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onContinue} className="gap-2">
          继续设置优化目标
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

