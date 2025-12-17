'use client';

import React from 'react';
import {
  Briefcase,
  Palette,
  Target,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { OptimizeSettings, DiagnosisResult } from '@/app/(main)/resume/page';

interface ResumeSettingsStepProps {
  settings: OptimizeSettings;
  onSettingsChange: (settings: OptimizeSettings) => void;
  diagnosis: DiagnosisResult | null;
}

// 风格选项
const styleOptions: Array<{
  value: OptimizeSettings['style'];
  label: string;
  description: string;
  icon: React.ElementType;
  colors: string[];
}> = [
  {
    value: 'professional',
    label: '专业正式',
    description: '适合传统行业、金融、法律',
    icon: Briefcase,
    colors: ['#1e293b', '#2563eb'],
  },
  {
    value: 'creative',
    label: '创意活泼',
    description: '适合互联网、设计、媒体',
    icon: Palette,
    colors: ['#9333ea', '#ec4899'],
  },
  {
    value: 'academic',
    label: '学术严谨',
    description: '适合研究机构、高校、教育',
    icon: Target,
    colors: ['#065f46', '#059669'],
  },
  {
    value: 'minimal',
    label: '简约精炼',
    description: '适合高管、咨询、管理',
    icon: MessageSquare,
    colors: ['#0f172a', '#475569'],
  },
];

// 优化重点选项
const focusAreaOptions = [
  { value: 'quantify', label: '量化成果', description: '将工作成果用数据表达' },
  { value: 'keywords', label: '关键词优化', description: '增加行业关键词密度' },
  { value: 'structure', label: '结构优化', description: '改善简历整体布局' },
  { value: 'concise', label: '精简内容', description: '删除冗余信息' },
  { value: 'highlight', label: '突出亮点', description: '强调核心优势' },
  { value: 'ats', label: 'ATS友好', description: '优化简历筛选系统通过率' },
];

export const ResumeSettingsStep: React.FC<ResumeSettingsStepProps> = ({
  settings,
  onSettingsChange,
  diagnosis,
}) => {
  const updateSettings = (partial: Partial<OptimizeSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  const toggleFocusArea = (value: string) => {
    const newAreas = settings.focusAreas.includes(value)
      ? settings.focusAreas.filter((a) => a !== value)
      : [...settings.focusAreas, value];
    updateSettings({ focusAreas: newAreas });
  };

  return (
    <div className="space-y-8">
      {/* 目标职位 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Briefcase className="h-5 w-5 text-primary" />
          目标职位
          <span className="text-xs font-normal text-muted-foreground">
            （可选）
          </span>
        </Label>
        <Input
          value={settings.targetPosition}
          onChange={(e) => updateSettings({ targetPosition: e.target.value })}
          placeholder="如：高级前端工程师、产品经理、数据分析师"
          className="h-12"
        />
        <p className="text-sm text-muted-foreground">
          填写目标职位后，AI 会根据岗位要求优化您的简历内容
        </p>
      </div>

      {/* 简历风格 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Palette className="h-5 w-5 text-primary" />
          简历风格
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {styleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = settings.style === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateSettings({ style: option.value })}
                className={cn(
                  'group relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                {/* 颜色指示条 */}
                <div
                  className="absolute right-3 top-3 h-2 w-8 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${option.colors[0]}, ${option.colors[1]})`,
                  }}
                />
                <div
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 优化重点 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Target className="h-5 w-5 text-primary" />
          优化重点
          <span className="text-xs font-normal text-muted-foreground">
            （可多选）
          </span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {focusAreaOptions.map((option) => {
            const isSelected = settings.focusAreas.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleFocusArea(option.value)}
                className={cn(
                  'group flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
                title={option.description}
              >
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                {option.label}
              </button>
            );
          })}
        </div>
        {/* 根据诊断结果推荐 */}
        {diagnosis && diagnosis.improvements.some((i) => i.priority === 'high') && (
          <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              💡 根据诊断结果，建议您选择
              <button
                onClick={() => {
                  const recommended = ['quantify', 'highlight'];
                  updateSettings({
                    focusAreas: [...new Set([...settings.focusAreas, ...recommended])],
                  });
                }}
                className="mx-1 font-medium underline underline-offset-2"
              >
                「量化成果」和「突出亮点」
              </button>
              以改善重要问题
            </p>
          </div>
        )}
      </div>

      {/* 自定义指令 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          自定义指令
          <span className="text-xs font-normal text-muted-foreground">
            （可选）
          </span>
        </Label>
        <Textarea
          value={settings.customInstruction}
          onChange={(e) => updateSettings({ customInstruction: e.target.value })}
          placeholder="告诉 AI 您希望如何优化，例如：&#10;- 突出我的管理经验&#10;- 简化技术描述，更偏向业务成果&#10;- 强调我在创业公司的工作经历"
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  );
};

