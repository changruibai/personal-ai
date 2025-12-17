'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Target,
  CheckCircle2,
  Upload,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { resumeApi } from '@/lib/api';

// 组件导入
import { ResumeUploadStep } from '@/components/resume/resume-upload-step';
import { ResumeDiagnosisStep } from '@/components/resume/resume-diagnosis-step';
import { ResumeSettingsStep } from '@/components/resume/resume-settings-step';
import { ResumeResultStep } from '@/components/resume/resume-result-step';

// 类型定义
export interface ResumeData {
  content: string;
  parsedData?: {
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    experience?: Array<{
      company: string;
      position: string;
      duration: string;
      description: string;
    }>;
    education?: Array<{
      school: string;
      degree: string;
      major: string;
      duration: string;
    }>;
    skills?: string[];
  };
}

export interface DiagnosisResult {
  score: number;
  overall: string;
  improvements: Array<{
    section: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  keywords: string[];
}

export interface OptimizeSettings {
  targetPosition: string;
  style: 'professional' | 'creative' | 'academic' | 'minimal';
  focusAreas: string[];
  customInstruction: string;
}

type Step = 'upload' | 'diagnosis' | 'settings' | 'result';

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'upload', label: '上传简历', icon: Upload },
  { id: 'diagnosis', label: 'AI诊断', icon: Target },
  { id: 'settings', label: '优化设置', icon: FileText },
  { id: 'result', label: '查看结果', icon: CheckCircle2 },
];

const ResumePage: React.FC = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [optimizeSettings, setOptimizeSettings] = useState<OptimizeSettings>({
    targetPosition: '',
    style: 'professional',
    focusAreas: [],
    customInstruction: '',
  });
  const [optimizedContent, setOptimizedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 获取当前步骤索引
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // 上传完成处理
  const handleUploadComplete = useCallback(
    async (content: string) => {
      setIsLoading(true);
      try {
        // 解析简历
        const parseResponse = await resumeApi.parse(content);
        setResumeData({
          content,
          parsedData: parseResponse.data,
        });

        // 自动获取诊断
        const suggestionsResponse = await resumeApi.getSuggestions(content);
        const suggestions = suggestionsResponse.data;

        // 计算评分 (基于建议的优先级)
        let score = 85;
        suggestions.improvements?.forEach(
          (item: { priority: 'high' | 'medium' | 'low' }) => {
            if (item.priority === 'high') score -= 10;
            else if (item.priority === 'medium') score -= 5;
            else score -= 2;
          }
        );
        score = Math.max(30, Math.min(100, score));

        setDiagnosisResult({
          score,
          overall: suggestions.overall || '简历整体结构完整，但有改进空间。',
          improvements: suggestions.improvements || [],
          keywords: suggestions.keywords || [],
        });

        setCurrentStep('diagnosis');
        toast({
          title: '简历分析完成',
          description: '已为您生成诊断报告',
        });
      } catch (error) {
        toast({
          title: '分析失败',
          description: (error as Error).message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // 开始优化
  const handleStartOptimize = useCallback(async () => {
    if (!resumeData?.content) return;

    setIsLoading(true);
    setOptimizedContent('');
    setCurrentStep('result');

    abortControllerRef.current = new AbortController();

    try {
      let result = '';
      for await (const chunk of resumeApi.optimizeStream(
        {
          content: resumeData.content,
          targetPosition: optimizeSettings.targetPosition || undefined,
          style: optimizeSettings.style,
          instruction:
            [
              optimizeSettings.focusAreas.length > 0
                ? `重点优化方向：${optimizeSettings.focusAreas.join('、')}`
                : '',
              optimizeSettings.customInstruction,
            ]
              .filter(Boolean)
              .join('\n') || undefined,
        },
        (chunk) => {
          result += chunk;
          setOptimizedContent(result);
        },
        abortControllerRef.current.signal
      )) {
        // 流式处理
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: '优化失败',
          description: (error as Error).message,
          variant: 'destructive',
        });
        setCurrentStep('settings');
      }
    } finally {
      setIsLoading(false);
    }
  }, [resumeData, optimizeSettings, toast]);

  // 重新开始
  const handleReset = useCallback(() => {
    abortControllerRef.current?.abort();
    setCurrentStep('upload');
    setResumeData(null);
    setDiagnosisResult(null);
    setOptimizedContent('');
    setOptimizeSettings({
      targetPosition: '',
      style: 'professional',
      focusAreas: [],
      customInstruction: '',
    });
  }, []);

  // 导航到上一步
  const handlePrevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  }, [currentStepIndex]);

  // 导航到下一步
  const handleNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      if (steps[nextIndex].id === 'result') {
        handleStartOptimize();
      } else {
        setCurrentStep(steps[nextIndex].id);
      }
    }
  }, [currentStepIndex, handleStartOptimize]);

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStepIndex === index;
          const isCompleted = currentStepIndex > index;
          const isClickable = currentStepIndex > index;

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div
                  className={cn(
                    'h-0.5 w-12 sm:w-20 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
              <button
                onClick={() => isClickable && setCurrentStep(step.id)}
                disabled={!isClickable}
                className={cn(
                  'group flex flex-col items-center gap-2 transition-all',
                  isClickable && 'cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors hidden sm:block',
                    isActive
                      ? 'text-foreground'
                      : isCompleted
                        ? 'text-primary'
                        : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <ResumeUploadStep
            onUpload={handleUploadComplete}
            isLoading={isLoading}
          />
        );
      case 'diagnosis':
        return diagnosisResult && resumeData ? (
          <ResumeDiagnosisStep
            diagnosis={diagnosisResult}
            resumeContent={resumeData.content}
            onContinue={handleNextStep}
          />
        ) : null;
      case 'settings':
        return (
          <ResumeSettingsStep
            settings={optimizeSettings}
            onSettingsChange={setOptimizeSettings}
            diagnosis={diagnosisResult}
          />
        );
      case 'result':
        return resumeData ? (
          <ResumeResultStep
            originalContent={resumeData.content}
            optimizedContent={optimizedContent}
            isLoading={isLoading}
            onRegenerate={handleStartOptimize}
          />
        ) : null;
      default:
        return null;
    }
  };

  // 渲染底部导航
  const renderNavigation = () => {
    // 上传步骤不需要导航按钮
    if (currentStep === 'upload') return null;

    return (
      <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? handleReset : handlePrevStep}
          disabled={isLoading}
        >
          {currentStepIndex === 0 ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              重新上传
            </>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              上一步
            </>
          )}
        </Button>

        {currentStep !== 'result' && (
          <Button onClick={handleNextStep} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : currentStep === 'settings' ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                开始优化
              </>
            ) : (
              <>
                下一步
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {currentStep === 'result' && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            重新开始
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-3">
            <div className="rounded-full bg-gradient-to-br from-primary to-primary/70 p-2.5">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            AI 简历优化助手
          </h1>
          <p className="mt-2 text-muted-foreground">
            智能分析、精准优化，让您的简历脱颖而出
          </p>
        </div>

        {/* 步骤指示器 */}
        {renderStepIndicator()}

        {/* 步骤内容 */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {renderStepContent()}
          {renderNavigation()}
        </div>
      </div>
    </div>
  );
};

export default ResumePage;
