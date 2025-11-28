'use client';

import type { FC } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { assistantApi } from '@/lib/api';

const assistantSchema = z.object({
  name: z.string().min(1, '请输入助手名称').max(50),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(1, '请输入系统提示词').max(10000),
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(128000).default(2048),
  isDefault: z.boolean().default(false),
});

type AssistantFormData = z.infer<typeof assistantSchema>;

interface Assistant {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
}

interface AssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: Assistant | null;
}

export const AssistantDialog: FC<AssistantDialogProps> = ({
  open,
  onOpenChange,
  assistant,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!assistant;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssistantFormData>({
    resolver: zodResolver(assistantSchema),
    defaultValues: {
      name: '',
      description: '',
      systemPrompt: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      isDefault: false,
    },
  });

  useEffect(() => {
    if (assistant) {
      reset({
        name: assistant.name,
        description: assistant.description || '',
        systemPrompt: assistant.systemPrompt,
        model: assistant.model,
        temperature: assistant.temperature,
        maxTokens: assistant.maxTokens,
        isDefault: assistant.isDefault,
      });
    } else {
      reset({
        name: '',
        description: '',
        systemPrompt: '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
        isDefault: false,
      });
    }
  }, [assistant, reset]);

  const createMutation = useMutation({
    mutationFn: (data: AssistantFormData) => assistantApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast({ title: 'AI助手创建成功' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ variant: 'destructive', title: '创建失败' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AssistantFormData) =>
      assistantApi.update(assistant!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast({ title: 'AI助手更新成功' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ variant: 'destructive', title: '更新失败' });
    },
  });

  const onSubmit = (data: AssistantFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '编辑AI助手' : '创建AI助手'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">助手名称 *</Label>
              <Input
                id="name"
                placeholder="例如：代码助手"
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                placeholder="简要描述这个助手的功能"
                {...register('description')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 系统提示词 */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">系统提示词 *</Label>
            <Textarea
              id="systemPrompt"
              placeholder="定义AI助手的角色、性格和能力..."
              className="min-h-[200px]"
              {...register('systemPrompt')}
              disabled={isLoading}
            />
            {errors.systemPrompt && (
              <p className="text-sm text-destructive">
                {errors.systemPrompt.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              提示词将作为系统消息发送给AI，定义助手的行为方式
            </p>
          </div>

          {/* 模型设置 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              <Input
                id="model"
                placeholder="gpt-4"
                {...register('model')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">温度 (0-2)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                {...register('temperature', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">最大Token</Label>
              <Input
                id="maxTokens"
                type="number"
                min="100"
                max="128000"
                {...register('maxTokens', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? '保存' : '创建'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

