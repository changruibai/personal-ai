'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  Check,
  Sparkles,
  Star,
  Globe,
  Grid3X3,
  LayoutTemplate,
  Columns,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumeTemplate, resumeApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelect: (template: ResumeTemplate) => void;
  resumeContent?: string; // 用于预览
  className?: string;
}

// 分类配置
const CATEGORIES: Array<{
  id: ResumeTemplate['category'] | 'all';
  name: string;
  icon: React.ElementType;
}> = [
  { id: 'all', name: '全部', icon: Grid3X3 },
  { id: 'professional', name: '专业', icon: LayoutTemplate },
  { id: 'modern', name: '现代', icon: Sparkles },
  { id: 'creative', name: '创意', icon: Star },
  { id: 'minimal', name: '简约', icon: Columns },
  { id: 'academic', name: '学术', icon: LayoutTemplate },
];

// 来源配置
const SOURCES = [
  { id: 'all', name: '全部来源' },
  { id: 'builtin', name: '内置模板' },
  { id: 'crawled', name: '网络爬取' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelect,
  resumeContent,
  className,
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    ResumeTemplate['category'] | 'all'
  >('all');
  const [activeSource, setActiveSource] = useState<'all' | 'builtin' | 'crawled'>('all');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);

  // 加载模板
  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await resumeApi.getTemplates({
        source: activeSource === 'all' ? undefined : activeSource,
      });
      setTemplates(response.data);
    } catch (error) {
      toast({
        title: '加载模板失败',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [activeSource]);

  // 爬取新模板
  const handleCrawlTemplates = async () => {
    try {
      setIsCrawling(true);
      const response = await resumeApi.crawlTemplates();
      toast({
        title: '爬取成功',
        description: response.data.message,
      });
      // 重新加载模板列表
      await loadTemplates();
    } catch (error) {
      toast({
        title: '爬取失败',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsCrawling(false);
    }
  };

  // 预览模板
  const handlePreview = async (template: ResumeTemplate) => {
    if (!resumeContent) {
      toast({
        title: '无法预览',
        description: '请先上传或输入简历内容',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await resumeApi.previewTemplate(template.id, resumeContent);
      setPreviewHtml(response.data.html);
      setPreviewTemplate(template);
    } catch (error) {
      toast({
        title: '预览失败',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') {
      return templates;
    }
    return templates.filter((t) => t.category === activeCategory);
  }, [templates, activeCategory]);

  // 获取来源标签颜色
  const getSourceBadgeClass = (source: string) => {
    if (source === '内置模板') {
      return 'bg-blue-500';
    }
    return 'bg-emerald-500';
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">正在加载模板...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 来源筛选 */}
        <div className="flex items-center gap-2">
          {SOURCES.map((source) => (
            <button
              key={source.id}
              onClick={() => setActiveSource(source.id as typeof activeSource)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                activeSource === source.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {source.name}
            </button>
          ))}
        </div>

        {/* 爬取按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCrawlTemplates}
          disabled={isCrawling}
        >
          {isCrawling ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          爬取新模板
        </Button>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          const count =
            category.id === 'all'
              ? templates.length
              : templates.filter((t) => t.category === category.id).length;

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {category.name}
              <span
                className={cn(
                  'ml-0.5 text-xs',
                  isActive ? 'opacity-80' : 'opacity-60'
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* 模板网格 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;

          return (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:shadow-lg'
              )}
            >
              {/* 预览图片 */}
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={template.previewImage}
                  alt={template.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* 选中标记 */}
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                {/* 来源标签 */}
                <div
                  className={cn(
                    'absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white',
                    getSourceBadgeClass(template.source)
                  )}
                >
                  {template.source === '内置模板' ? (
                    <Star className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  {template.source}
                </div>

                {/* 悬停时显示操作 */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="w-full p-3">
                    <div className="flex gap-2">
                      {resumeContent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(template);
                          }}
                          className="flex-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30"
                        >
                          预览效果
                        </button>
                      )}
                      {template.sourceUrl && (
                        <a
                          href={template.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30"
                        >
                          <ExternalLink className="h-3 w-3" />
                          来源
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 模板信息 */}
              <div className="p-3">
                <h3 className="truncate font-semibold">{template.name}</h3>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {template.description}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">
                    {template.category === 'professional'
                      ? '专业'
                      : template.category === 'modern'
                        ? '现代'
                        : template.category === 'creative'
                          ? '创意'
                          : template.category === 'minimal'
                            ? '简约'
                            : '学术'}
                  </span>
                  <span>·</span>
                  <span>{template.placeholders.length} 个字段</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredTemplates.length === 0 && (
        <div className="py-12 text-center">
          <LayoutTemplate className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">该分类下暂无模板</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleCrawlTemplates}
            disabled={isCrawling}
          >
            {isCrawling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            爬取更多模板
          </Button>
        </div>
      )}

      {/* 预览弹窗 */}
      {previewHtml && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setPreviewHtml(null);
              setPreviewTemplate(null);
            }}
          />
          <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="font-semibold">{previewTemplate.name} 预览</h3>
                <p className="text-sm text-muted-foreground">
                  查看模板应用到您简历后的效果
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewHtml(null);
                    setPreviewTemplate(null);
                  }}
                >
                  关闭
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onSelect(previewTemplate);
                    setPreviewHtml(null);
                    setPreviewTemplate(null);
                  }}
                >
                  使用此模板
                </Button>
              </div>
            </div>
            <div className="max-h-[calc(90vh-80px)] overflow-auto">
              <iframe
                srcDoc={previewHtml}
                className="h-[800px] w-full border-0"
                title="模板预览"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
