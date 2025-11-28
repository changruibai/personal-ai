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
import { promptApi } from '@/lib/api';

const promptSchema = z.object({
  title: z.string().min(1, '请输入标题').max(100),
  content: z.string().min(1, '请输入内容').max(10000),
  category: z.string().max(50).optional(),
  tags: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface Prompt {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  isPublic: boolean;
}

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
}

export const PromptDialog: FC<PromptDialogProps> = ({
  open,
  onOpenChange,
  prompt,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!prompt;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '',
      tags: '',
      isPublic: false,
    },
  });

  useEffect(() => {
    if (prompt) {
      reset({
        title: prompt.title,
        content: prompt.content,
        category: prompt.category || '',
        tags: prompt.tags.join(', '),
        isPublic: prompt.isPublic,
      });
    } else {
      reset({
        title: '',
        content: '',
        category: '',
        tags: '',
        isPublic: false,
      });
    }
  }, [prompt, reset]);

  const createMutation = useMutation({
    mutationFn: (data: PromptFormData) =>
      promptApi.create({
        ...data,
        tags: data.tags
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({ title: 'Prompt创建成功' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ variant: 'destructive', title: '创建失败' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PromptFormData) =>
      promptApi.update(prompt!.id, {
        ...data,
        tags: data.tags
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({ title: 'Prompt更新成功' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ variant: 'destructive', title: '更新失败' });
    },
  });

  const onSubmit = (data: PromptFormData) => {
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
            {isEditing ? '编辑Prompt' : '创建Prompt'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                placeholder="给你的Prompt起个名字"
                {...register('title')}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">内容 *</Label>
              <Textarea
                id="content"
                placeholder="输入你的Prompt内容..."
                className="min-h-[200px]"
                {...register('content')}
                disabled={isLoading}
              />
              {errors.content && (
                <p className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  placeholder="例如：编程、写作"
                  {...register('category')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  placeholder="用逗号分隔，如：代码,优化"
                  {...register('tags')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                className="h-4 w-4 rounded border-input"
                {...register('isPublic')}
                disabled={isLoading}
              />
              <Label htmlFor="isPublic" className="font-normal">
                公开分享（其他用户可以看到并使用）
              </Label>
            </div>
          </div>

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

