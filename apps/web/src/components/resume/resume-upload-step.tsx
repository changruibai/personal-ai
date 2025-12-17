'use client';

import React, { useCallback, useState } from 'react';
import {
  Upload,
  FileText,
  FileType,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { resumeApi } from '@/lib/api';

interface ResumeUploadStepProps {
  onUpload: (content: string) => void;
  isLoading?: boolean;
}

// 支持的文件类型
const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.docx', '.pdf'];

// 示例简历
const sampleResume = `# 张三

**求职意向：高级前端工程师**

## 联系方式
- 邮箱：zhangsan@email.com
- 电话：138-0000-0000
- GitHub：github.com/zhangsan

## 个人简介
5年前端开发经验，熟悉React、Vue等主流框架，有丰富的大型项目经验。

## 工作经历

### ABC科技有限公司 | 高级前端工程师 | 2021.06 - 至今
- 负责公司核心产品的前端架构设计和开发
- 带领3人团队完成多个重要项目
- 优化页面性能，首屏加载时间减少40%

### XYZ互联网公司 | 前端工程师 | 2019.07 - 2021.05
- 参与电商平台的前端开发
- 使用Vue.js重构了后台管理系统
- 编写单元测试，代码覆盖率达到80%

## 教育背景

### 某某大学 | 计算机科学与技术 | 本科 | 2015-2019

## 专业技能
- 前端框架：React、Vue、Angular
- 编程语言：JavaScript、TypeScript
- 工具：Webpack、Git、Docker
- 其他：Node.js、MySQL`;

export const ResumeUploadStep: React.FC<ResumeUploadStepProps> = ({
  onUpload,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isFileAllowed = (file: File): boolean => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return SUPPORTED_EXTENSIONS.includes(ext);
  };

  const processFile = async (file: File) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    // 对于 txt 和 md 文件，直接在前端读取
    if (ext === '.txt' || ext === '.md') {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    // 对于 docx 和 pdf，上传到后端解析
    const result = await resumeApi.uploadFile(file);
    return result.rawContent;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        if (!isFileAllowed(file)) {
          toast({
            title: '不支持的文件格式',
            description: '请上传 .txt, .md, .docx 或 .pdf 文件',
            variant: 'destructive',
          });
          return;
        }

        setUploadedFile(file);
        setIsUploading(true);
        try {
          const content = await processFile(file);
          onUpload(content);
        } catch (error) {
          toast({
            title: '文件解析失败',
            description: (error as Error).message,
            variant: 'destructive',
          });
          setUploadedFile(null);
        } finally {
          setIsUploading(false);
        }
      }
    },
    [onUpload, toast]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!isFileAllowed(file)) {
          toast({
            title: '不支持的文件格式',
            description: '请上传 .txt, .md, .docx 或 .pdf 文件',
            variant: 'destructive',
          });
          return;
        }

        setUploadedFile(file);
        setIsUploading(true);
        try {
          const content = await processFile(file);
          onUpload(content);
        } catch (error) {
          toast({
            title: '文件解析失败',
            description: (error as Error).message,
            variant: 'destructive',
          });
          setUploadedFile(null);
        } finally {
          setIsUploading(false);
        }
      }
      e.target.value = '';
    },
    [onUpload, toast]
  );

  const handlePasteSubmit = useCallback(() => {
    if (textInput.trim()) {
      onUpload(textInput);
    }
  }, [textInput, onUpload]);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  const currentLoading = isLoading || isUploading;

  // 获取文件图标
  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    if (ext === '.pdf') return <FileType className="h-6 w-6 text-red-500" />;
    if (ext === '.docx') return <FileText className="h-6 w-6 text-blue-500" />;
    return <FileText className="h-6 w-6 text-primary" />;
  };

  return (
    <div className="space-y-6">
      {/* 模式切换 */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            onClick={() => setMode('upload')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
              mode === 'upload'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Upload className="h-4 w-4" />
            上传文件
          </button>
          <button
            onClick={() => setMode('paste')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
              mode === 'paste'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ClipboardPaste className="h-4 w-4" />
            粘贴内容
          </button>
        </div>
      </div>

      {/* 上传区域 */}
      {mode === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
            currentLoading && 'pointer-events-none opacity-70'
          )}
        >
          <input
            type="file"
            accept=".txt,.md,.docx,.pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={currentLoading}
          />

          {currentLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative rounded-full bg-gradient-to-br from-primary to-primary/70 p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium">正在分析您的简历...</p>
                <p className="text-sm text-muted-foreground">
                  AI 正在解析内容并生成诊断报告
                </p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 rounded-xl bg-muted px-5 py-3">
                {getFileIcon(uploadedFile.name)}
                <span className="font-medium">{uploadedFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="ml-1 rounded-full p-1.5 transition-colors hover:bg-muted-foreground/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                点击或拖拽新文件以替换
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 px-4">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-3">
                <div className="rounded-full bg-gradient-to-br from-primary to-primary/70 p-3">
                  <Upload className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">拖拽文件到这里，或点击上传</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  支持{' '}
                  <span className="font-medium text-foreground">.docx</span>、
                  <span className="font-medium text-foreground">.pdf</span>、
                  <span className="font-medium text-foreground">.txt</span>、
                  <span className="font-medium text-foreground">.md</span> 格式
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 粘贴区域 */}
      {mode === 'paste' && (
        <div className="space-y-4">
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`将您的简历内容粘贴到这里...

支持 Markdown 格式，例如：
# 姓名
**求职意向：职位名称**

## 工作经历
### 公司名称 | 职位 | 时间
- 工作内容描述`}
            className="min-h-[280px] resize-none text-sm leading-relaxed"
            disabled={currentLoading}
          />
          <Button
            onClick={handlePasteSubmit}
            disabled={!textInput.trim() || currentLoading}
            className="w-full gap-2"
            size="lg"
          >
            {currentLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                开始分析
              </>
            )}
          </Button>
        </div>
      )}

      {/* 示例简历 */}
      <div className="flex items-center justify-center gap-2 border-t border-border pt-6">
        <span className="text-sm text-muted-foreground">没有简历？</span>
        <Button
          variant="link"
          className="h-auto gap-1 p-0 text-sm font-medium"
          onClick={() => onUpload(sampleResume)}
          disabled={currentLoading}
        >
          使用示例简历体验
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

