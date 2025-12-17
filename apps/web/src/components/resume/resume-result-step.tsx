'use client';

import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  RefreshCw,
  Loader2,
  Eye,
  Code,
  ArrowLeftRight,
  FileText,
  FileType,
  ChevronDown,
  Palette,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { resumeApi, ResumeTemplate } from '@/lib/api';
import MarkdownRenderer from '@/components/chat/markdown-renderer';
import { ResumePreview } from './resume-preview';
import { TemplateSelector } from './template-selector';

interface ResumeResultStepProps {
  originalContent: string;
  optimizedContent: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

type ViewMode = 'compare' | 'optimized' | 'original';
type PreviewStyle = 'styled' | 'markdown';

export const ResumeResultStep: React.FC<ResumeResultStepProps> = ({
  originalContent,
  optimizedContent,
  isLoading,
  onRegenerate,
}) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('compare');
  const [previewStyle, setPreviewStyle] = useState<PreviewStyle>('styled');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);

  // 计算字数变化
  const wordCountChange = useMemo(() => {
    const originalCount = originalContent.replace(/\s/g, '').length;
    const optimizedCount = optimizedContent.replace(/\s/g, '').length;
    const diff = optimizedCount - originalCount;
    return {
      original: originalCount,
      optimized: optimizedCount,
      diff,
      percentage: originalCount > 0 ? Math.round((diff / originalCount) * 100) : 0,
    };
  }, [originalContent, optimizedContent]);

  // 复制内容
  const handleCopy = async () => {
    await navigator.clipboard.writeText(optimizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: '已复制到剪贴板' });
  };

  // 处理模板选择
  const handleSelectTemplate = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    toast({
      title: '模板已选择',
      description: `已选择「${template.name}」模板，导出时将应用此模板`,
    });
  };

  // 导出 HTML
  const handleExportHTML = async () => {
    if (!optimizedContent.trim()) {
      toast({
        title: '没有可下载的内容',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);
    try {
      let html: string;
      
      // 如果选择了模板，使用模板导出
      if (selectedTemplate) {
        const response = await resumeApi.exportWithTemplate(
          optimizedContent,
          selectedTemplate.id
        );
        html = response.data.html;
      } else {
        const response = await resumeApi.exportHTML(optimizedContent, 'professional');
        html = response.data.html;
      }

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${selectedTemplate?.id || 'professional'}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: '下载成功',
        description: selectedTemplate 
          ? `简历已使用「${selectedTemplate.name}」模板导出`
          : '简历 HTML 文件已下载，可在浏览器中打开并打印为 PDF',
      });
    } catch (error) {
      toast({
        title: '下载失败',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 导出 Word
  const handleExportWord = async () => {
    if (!optimizedContent.trim()) {
      toast({
        title: '没有可下载的内容',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);
    try {
      let blob: Blob;
      
      // 如果选择了模板，使用模板导出
      if (selectedTemplate) {
        blob = await resumeApi.exportWithTemplateDocx(
          optimizedContent,
          selectedTemplate.id
        );
      } else {
        blob = await resumeApi.exportDocx(optimizedContent, 'professional');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${selectedTemplate?.id || 'professional'}-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: '下载成功',
        description: selectedTemplate 
          ? `简历已使用「${selectedTemplate.name}」模板导出`
          : '简历 Word 文档已下载',
      });
    } catch (error) {
      toast({
        title: '下载失败',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 渲染简历内容
  const renderContent = (content: string, type: 'original' | 'optimized') => {
    if (isLoading && type === 'optimized' && !content) {
      return (
        <div className="flex h-full min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 font-medium">AI 正在优化您的简历...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              这可能需要 10-20 秒
            </p>
          </div>
        </div>
      );
    }

    if (!content.trim()) {
      return (
        <div className="flex h-full min-h-[400px] items-center justify-center text-muted-foreground">
          <p className="text-center text-sm">暂无内容</p>
        </div>
      );
    }

    if (previewStyle === 'styled') {
      return <ResumePreview content={content} theme="professional" />;
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MarkdownRenderer content={content} />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 视图模式切换 */}
        <div className="flex rounded-lg border border-border p-1">
          <button
            onClick={() => setViewMode('compare')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              viewMode === 'compare'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ArrowLeftRight className="h-4 w-4" />
            对比
          </button>
          <button
            onClick={() => setViewMode('optimized')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              viewMode === 'optimized'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            优化版
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              viewMode === 'original'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            原版
          </button>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-2">
          {/* 预览样式切换 */}
          <div className="flex rounded-md border border-border">
            <button
              onClick={() => setPreviewStyle('styled')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 text-sm transition-all',
                previewStyle === 'styled'
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              样式
            </button>
            <button
              onClick={() => setPreviewStyle('markdown')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 text-sm transition-all',
                previewStyle === 'markdown'
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Code className="h-3.5 w-3.5" />
              源码
            </button>
          </div>

          {/* 模板选择按钮 */}
          <Button
            variant={selectedTemplate ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowTemplateModal(true)}
            disabled={!optimizedContent || isLoading}
            className={cn(
              selectedTemplate && 'bg-gradient-to-r from-primary to-primary/80'
            )}
          >
            <Palette className="mr-1.5 h-4 w-4" />
            {selectedTemplate ? selectedTemplate.name : '选择模板'}
          </Button>

          {/* 操作按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!optimizedContent || isLoading}
          >
            {copied ? (
              <Check className="mr-1.5 h-4 w-4" />
            ) : (
              <Copy className="mr-1.5 h-4 w-4" />
            )}
            复制
          </Button>
          {/* 下载下拉菜单 */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!optimizedContent || isLoading || isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              下载
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg">
                  <button
                    onClick={handleExportWord}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    <FileType className="h-4 w-4 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">Word 文档</div>
                      <div className="text-xs text-muted-foreground">
                        .docx 格式，可编辑
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportHTML}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    <FileText className="h-4 w-4 text-orange-500" />
                    <div className="text-left">
                      <div className="font-medium">HTML 网页</div>
                      <div className="text-xs text-muted-foreground">
                        可打印为 PDF
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn('mr-1.5 h-4 w-4', isLoading && 'animate-spin')}
            />
            重新生成
          </Button>
        </div>
      </div>

      {/* 字数统计 */}
      {optimizedContent && !isLoading && (
        <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">原版：</span>
            <span className="font-medium">{wordCountChange.original} 字</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">优化后：</span>
            <span className="font-medium">{wordCountChange.optimized} 字</span>
            {wordCountChange.diff !== 0 && (
              <span
                className={cn(
                  'text-xs',
                  wordCountChange.diff > 0 ? 'text-emerald-500' : 'text-amber-500'
                )}
              >
                ({wordCountChange.diff > 0 ? '+' : ''}
                {wordCountChange.diff} 字, {wordCountChange.percentage > 0 ? '+' : ''}
                {wordCountChange.percentage}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div
        className={cn(
          'min-h-[500px] rounded-lg border border-border',
          viewMode === 'compare' ? 'grid md:grid-cols-2' : ''
        )}
      >
        {/* 原版 */}
        {(viewMode === 'compare' || viewMode === 'original') && (
          <div
            className={cn(
              'overflow-auto p-4',
              viewMode === 'compare' &&
                'border-b border-border md:border-b-0 md:border-r'
            )}
          >
            {viewMode === 'compare' && (
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  原版简历
                </span>
              </div>
            )}
            {renderContent(originalContent, 'original')}
          </div>
        )}

        {/* 优化版 */}
        {(viewMode === 'compare' || viewMode === 'optimized') && (
          <div className="overflow-auto p-4">
            {viewMode === 'compare' && (
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                <span className="text-sm font-medium text-primary">
                  ✨ 优化后
                </span>
              </div>
            )}
            {renderContent(optimizedContent, 'optimized')}
          </div>
        )}
      </div>

      {/* 提示信息 */}
      {optimizedContent && !isLoading && (
        <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            ✅ 简历优化完成！您可以：
          </p>
          <ul className="mt-2 space-y-1 text-sm text-emerald-600 dark:text-emerald-500">
            <li>• 点击「<Palette className="inline h-3 w-3" /> 选择模板」挑选精美的简历模板</li>
            <li>• 点击「复制」将优化后的内容粘贴到其他地方</li>
            <li>• 点击「下载」→「Word 文档」导出可编辑的 .docx 文件</li>
            <li>• 点击「下载」→「HTML 网页」导出后可打印为 PDF</li>
            <li>• 如果不满意，点击「重新生成」让 AI 再次优化</li>
          </ul>
        </div>
      )}

      {/* 模板选择弹窗 */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTemplateModal(false)}
          />

          {/* 弹窗内容 */}
          <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">选择简历模板</h2>
                  <p className="text-sm text-muted-foreground">
                    挑选一个精美的模板，让您的简历更加出众
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 弹窗内容区域 */}
            <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
              <TemplateSelector
                selectedTemplateId={selectedTemplate?.id || null}
                onSelect={handleSelectTemplate}
                resumeContent={optimizedContent}
              />
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <div className="text-sm text-muted-foreground">
                {selectedTemplate ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    已选择：
                    <span className="font-medium text-foreground">
                      {selectedTemplate.name}
                    </span>
                  </span>
                ) : (
                  '请选择一个模板'
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setShowTemplateModal(false);
                  }}
                >
                  取消选择
                </Button>
                <Button
                  onClick={() => setShowTemplateModal(false)}
                  disabled={!selectedTemplate}
                >
                  确认使用
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

