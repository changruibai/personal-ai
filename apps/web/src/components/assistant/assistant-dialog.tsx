'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { assistantApi, chatApi } from '@/lib/api';

const assistantSchema = z.object({
  name: z.string().min(1, '请输入助手名称').max(50),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(1, '请输入系统提示词').max(10000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(128000).optional(),
  isDefault: z.boolean().optional(),
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

export const AssistantDialog: FC<AssistantDialogProps> = ({ open, onOpenChange, assistant }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isEditing = !!assistant;
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      model: 'gpt-4o',
      temperature: 0.9,
      maxTokens: 4096,
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
        model: 'gpt-4o',
        temperature: 0.9,
        maxTokens: 4096,
        isDefault: false,
      });
    }
  }, [assistant, reset]);

  const createMutation = useMutation({
    mutationFn: (data: AssistantFormData) => assistantApi.create(data),
    onSuccess: async (response: { data: Assistant }) => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      const assistantId = response.data.id;

      // 提示用户是否开始对话
      toast({
        title: 'AI助手创建成功',
        description: '是否立即开始与助手对话？',
        action: (
          <Button
            size="sm"
            onClick={async () => {
              try {
                const res = await chatApi.createConversation({ assistantId });
                router.push(`/chat?id=${res.data.id}`);
              } catch {
                toast({ variant: 'destructive', title: '创建对话失败' });
              }
            }}
          >
            开始对话
          </Button>
        ),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({ variant: 'destructive', title: '创建失败' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AssistantFormData) => assistantApi.update(assistant!.id, data),
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑AI助手' : '创建AI助手'}</DialogTitle>
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
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
              <p className="text-sm text-destructive">{errors.systemPrompt.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              提示词将作为系统消息发送给AI，定义助手的行为方式
            </p>
          </div>

          {/* 高级设置 */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between rounded-lg p-3 text-sm font-medium hover:bg-accent"
              disabled={isLoading}
            >
              <span>高级设置</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">模型</Label>
                  <Input
                    id="model"
                    placeholder="gpt-4o"
                    {...register('model')}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">默认: gpt-4o</p>
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
                  <p className="text-xs text-muted-foreground">默认: 0.9</p>
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
                  <p className="text-xs text-muted-foreground">默认: 4096</p>
                </div>
              </div>
            )}
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
