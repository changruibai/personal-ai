'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

export type ResumeTheme =
  | 'professional'
  | 'creative'
  | 'academic'
  | 'minimal'
  | 'modern'
  | 'elegant';

interface ResumePreviewProps {
  content: string;
  theme: ResumeTheme;
  className?: string;
}

// 主题配置
const themeConfigs: Record<
  ResumeTheme,
  {
    name: string;
    headerBg: string;
    headerText: string;
    accentColor: string;
    bodyBg: string;
    bodyText: string;
    headingColor: string;
    borderColor: string;
    tagBg: string;
    tagText: string;
  }
> = {
  professional: {
    name: '专业正式',
    headerBg: 'bg-slate-800',
    headerText: 'text-white',
    accentColor: 'text-blue-600',
    bodyBg: 'bg-white dark:bg-slate-900',
    bodyText: 'text-slate-700 dark:text-slate-300',
    headingColor: 'text-slate-800 dark:text-slate-200',
    borderColor: 'border-blue-600',
    tagBg: 'bg-blue-50 dark:bg-blue-950',
    tagText: 'text-blue-700 dark:text-blue-300',
  },
  creative: {
    name: '创意活泼',
    headerBg: 'bg-gradient-to-r from-purple-600 to-pink-500',
    headerText: 'text-white',
    accentColor: 'text-purple-600',
    bodyBg: 'bg-white dark:bg-slate-900',
    bodyText: 'text-slate-700 dark:text-slate-300',
    headingColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-500',
    tagBg: 'bg-purple-50 dark:bg-purple-950',
    tagText: 'text-purple-700 dark:text-purple-300',
  },
  academic: {
    name: '学术严谨',
    headerBg: 'bg-emerald-800',
    headerText: 'text-white',
    accentColor: 'text-emerald-700',
    bodyBg: 'bg-stone-50 dark:bg-slate-900',
    bodyText: 'text-stone-700 dark:text-stone-300',
    headingColor: 'text-emerald-800 dark:text-emerald-400',
    borderColor: 'border-emerald-600',
    tagBg: 'bg-emerald-50 dark:bg-emerald-950',
    tagText: 'text-emerald-700 dark:text-emerald-300',
  },
  minimal: {
    name: '简约精炼',
    headerBg: 'bg-slate-900',
    headerText: 'text-white',
    accentColor: 'text-slate-600',
    bodyBg: 'bg-white dark:bg-slate-900',
    bodyText: 'text-slate-600 dark:text-slate-400',
    headingColor: 'text-slate-900 dark:text-slate-100',
    borderColor: 'border-slate-300 dark:border-slate-700',
    tagBg: 'bg-slate-100 dark:bg-slate-800',
    tagText: 'text-slate-700 dark:text-slate-300',
  },
  modern: {
    name: '现代科技',
    headerBg: 'bg-gradient-to-r from-cyan-600 to-blue-600',
    headerText: 'text-white',
    accentColor: 'text-cyan-600',
    bodyBg: 'bg-slate-50 dark:bg-slate-900',
    bodyText: 'text-slate-700 dark:text-slate-300',
    headingColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-500',
    tagBg: 'bg-cyan-50 dark:bg-cyan-950',
    tagText: 'text-cyan-700 dark:text-cyan-300',
  },
  elegant: {
    name: '优雅高端',
    headerBg: 'bg-gradient-to-r from-amber-700 to-yellow-600',
    headerText: 'text-white',
    accentColor: 'text-amber-700',
    bodyBg: 'bg-amber-50/30 dark:bg-slate-900',
    bodyText: 'text-stone-700 dark:text-stone-300',
    headingColor: 'text-amber-800 dark:text-amber-400',
    borderColor: 'border-amber-500',
    tagBg: 'bg-amber-50 dark:bg-amber-950',
    tagText: 'text-amber-700 dark:text-amber-300',
  },
};

// 解析 Markdown 内容
function parseMarkdown(content: string): {
  name?: string;
  title?: string;
  contact?: string[];
  summary?: string;
  sections: Array<{ heading: string; items: string[] }>;
} {
  const lines = content.split('\n');
  let name: string | undefined;
  let title: string | undefined;
  const contact: string[] = [];
  let summary: string | undefined;
  const sections: Array<{ heading: string; items: string[] }> = [];

  let currentSection: { heading: string; items: string[] } | null = null;
  let inSummary = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 一级标题 - 姓名
    if (trimmed.startsWith('# ')) {
      name = trimmed.slice(2).trim();
      continue;
    }

    // 加粗的求职意向
    if (trimmed.startsWith('**') && trimmed.includes('求职意向')) {
      title = trimmed
        .replace(/\*\*/g, '')
        .replace('求职意向：', '')
        .replace('求职意向:', '')
        .trim();
      continue;
    }

    // 二级标题 - 章节
    if (trimmed.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const heading = trimmed.slice(3).trim();
      if (heading.includes('联系') || heading.includes('Contact')) {
        currentSection = { heading, items: [] };
        continue;
      }
      if (
        heading.includes('简介') ||
        heading.includes('Summary') ||
        heading.includes('目标')
      ) {
        inSummary = true;
        currentSection = null;
        continue;
      }
      inSummary = false;
      currentSection = { heading, items: [] };
      continue;
    }

    // 三级标题 - 子项
    if (trimmed.startsWith('### ')) {
      if (currentSection) {
        currentSection.items.push(trimmed.slice(4).trim());
      }
      continue;
    }

    // 列表项
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const item = trimmed.slice(2).trim();
      if (currentSection?.heading.includes('联系')) {
        contact.push(item);
      } else if (currentSection) {
        currentSection.items.push(item);
      }
      continue;
    }

    // 普通文本
    if (trimmed && inSummary) {
      summary = (summary ? summary + ' ' : '') + trimmed;
    } else if (trimmed && currentSection && !trimmed.startsWith('#')) {
      currentSection.items.push(trimmed);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return { name, title, contact, summary, sections };
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  content,
  theme,
  className,
}) => {
  const config = themeConfigs[theme];
  const parsed = useMemo(() => parseMarkdown(content), [content]);

  if (!content.trim()) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center text-muted-foreground',
          className
        )}
      >
        <p className="text-center text-sm">暂无内容</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'resume-preview overflow-hidden rounded-lg shadow-lg',
        config.bodyBg,
        className
      )}
    >
      {/* Header */}
      {(parsed.name || parsed.title) && (
        <div className={cn('px-6 py-5', config.headerBg, config.headerText)}>
          {parsed.name && <h1 className="text-2xl font-bold">{parsed.name}</h1>}
          {parsed.title && (
            <p className="mt-1 text-lg opacity-90">{parsed.title}</p>
          )}
          {parsed.contact && parsed.contact.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-80">
              {parsed.contact.map((item, i) => (
                <span key={i}>{item.replace(/^[^:]+:\s*/, '')}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className={cn('space-y-5 p-6', config.bodyText)}>
        {/* Summary */}
        {parsed.summary && (
          <div>
            <h2
              className={cn(
                'mb-2 border-b-2 pb-1 text-lg font-semibold',
                config.headingColor,
                config.borderColor
              )}
            >
              个人简介
            </h2>
            <p className="text-sm leading-relaxed">{parsed.summary}</p>
          </div>
        )}

        {/* Sections */}
        {parsed.sections
          .filter((s) => !s.heading.includes('联系'))
          .map((section, idx) => (
            <div key={idx}>
              <h2
                className={cn(
                  'mb-3 border-b-2 pb-1 text-lg font-semibold',
                  config.headingColor,
                  config.borderColor
                )}
              >
                {section.heading}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, i) => {
                  // 检查是否是经历项（包含 | 分隔符）
                  if (item.includes('|')) {
                    const parts = item.split('|').map((p) => p.trim());
                    return (
                      <div key={i} className="mb-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className={cn('font-medium', config.headingColor)}>
                            {parts[0]}
                          </span>
                          {parts[1] && (
                            <span className={config.accentColor}>{parts[1]}</span>
                          )}
                          {parts[2] && (
                            <span className="text-xs text-muted-foreground">
                              {parts[2]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // 检查是否是技能标签（包含逗号分隔的多项）
                  if (section.heading.includes('技能') && item.includes('：')) {
                    const [label, skills] = item.split('：');
                    return (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <span className={cn('text-sm font-medium', config.headingColor)}>
                          {label}：
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.split('、').map((skill, j) => (
                            <span
                              key={j}
                              className={cn(
                                'rounded px-2 py-0.5 text-xs',
                                config.tagBg,
                                config.tagText
                              )}
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 普通列表项
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className={cn(
                          'mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full',
                          config.accentColor.replace('text-', 'bg-')
                        )}
                      />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// 导出主题列表供选择器使用
export const resumeThemes: Array<{
  value: ResumeTheme;
  label: string;
  description: string;
  colors: string[];
}> = [
  {
    value: 'professional',
    label: '专业正式',
    description: '传统行业、金融、法律',
    colors: ['#1e293b', '#2563eb'],
  },
  {
    value: 'creative',
    label: '创意活泼',
    description: '互联网、设计、媒体',
    colors: ['#9333ea', '#ec4899'],
  },
  {
    value: 'academic',
    label: '学术严谨',
    description: '研究机构、高校、教育',
    colors: ['#065f46', '#059669'],
  },
  {
    value: 'minimal',
    label: '简约精炼',
    description: '高管、咨询、管理',
    colors: ['#0f172a', '#475569'],
  },
  {
    value: 'modern',
    label: '现代科技',
    description: '科技公司、工程、IT',
    colors: ['#0891b2', '#2563eb'],
  },
  {
    value: 'elegant',
    label: '优雅高端',
    description: '奢侈品、时尚、艺术',
    colors: ['#b45309', '#ca8a04'],
  },
];

export default ResumePreview;
