'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Image as ImageIcon, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { imageApi } from '@/lib/api';

const imageGenerationSchema = z.object({
  prompt: z.string().min(1, '请输入图像描述').max(2000),
  provider: z.enum(['replicate', 'huggingface']),
  size: z.enum(['512x512', '512x768', '768x512', '1024x1024']).optional(),
  negativePrompt: z.string().max(1000).optional(),
  numImages: z.number().min(1).max(4).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  steps: z.number().min(1).max(100).optional(),
  seed: z.number().optional(),
});

type ImageGenerationFormData = z.infer<typeof imageGenerationSchema>;

interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  provider: string;
  model: string;
  prompt: string;
}

interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId?: string;
  onImagesGenerated?: (images: GeneratedImage[]) => void;
}

export const ImageGenerationDialog: FC<ImageGenerationDialogProps> = ({
  open,
  onOpenChange,
  conversationId,
  onImagesGenerated,
}) => {
  const { toast } = useToast();
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ImageGenerationFormData>({
    resolver: zodResolver(imageGenerationSchema),
    defaultValues: {
      prompt: '',
      provider: 'replicate',
      size: '1024x1024',
      negativePrompt: '',
      numImages: 1,
      guidanceScale: 7.5,
      steps: 50,
    },
  });

  const generateMutation = useMutation({
    mutationFn: (data: ImageGenerationFormData) => {
      if (conversationId) {
        return imageApi.generateInConversation({
          conversationId,
          ...data,
        });
      }
      return imageApi.generate(data);
    },
    onSuccess: (response) => {
      const images = conversationId ? response.data : response.data;
      setGeneratedImages(images);
      onImagesGenerated?.(images);
      toast({
        title: '生成成功',
        description: `成功生成 ${images.length} 张图像`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '生成失败',
        description: error.response?.data?.message || error.message || '图像生成失败',
      });
    },
  });

  const onSubmit = async (data: ImageGenerationFormData) => {
    setGeneratedImages([]);
    generateMutation.mutate(data);
  };

  const handleClose = () => {
    if (!generateMutation.isPending) {
      reset();
      setGeneratedImages([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 图像生成
          </DialogTitle>
          <DialogDescription>
            使用 AI 模型生成精美图像。支持 Replicate（高质量）和 Hugging Face（免费）两种服务。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 图像描述 */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              图像描述 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="prompt"
              placeholder="例如：A beautiful sunset over the ocean, digital art, highly detailed, 4k"
              className="min-h-[100px]"
              {...register('prompt')}
              disabled={generateMutation.isPending}
            />
            {errors.prompt && (
              <p className="text-sm text-red-500">{errors.prompt.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              提示：使用英文描述可以获得更好的效果。描述越详细，生成的图像越符合预期。
            </p>
          </div>

          {/* 服务提供商 */}
          <div className="space-y-2">
            <Label htmlFor="provider">服务提供商</Label>
            <select
              id="provider"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('provider')}
              disabled={generateMutation.isPending}
            >
              <option value="replicate">Replicate（推荐 - SDXL 高质量）</option>
              <option value="huggingface">Hugging Face（免费 - SD 2.1）</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Replicate 需要 API Key，质量更高；Hugging Face 免费但可能需要等待模型加载
            </p>
          </div>

          {/* 图像尺寸 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">图像尺寸</Label>
              <select
                id="size"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('size')}
                disabled={generateMutation.isPending}
              >
                <option value="512x512">正方形 (512x512)</option>
                <option value="512x768">竖版 (512x768)</option>
                <option value="768x512">横版 (768x512)</option>
                <option value="1024x1024">大尺寸 (1024x1024)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numImages">生成数量</Label>
              <Input
                id="numImages"
                type="number"
                min="1"
                max="4"
                {...register('numImages', { valueAsNumber: true })}
                disabled={generateMutation.isPending}
              />
            </div>
          </div>

          {/* 高级选项 */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              高级选项
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="negativePrompt">负面提示词（不希望出现的内容）</Label>
                  <Textarea
                    id="negativePrompt"
                    placeholder="例如：low quality, blurry, distorted"
                    {...register('negativePrompt')}
                    disabled={generateMutation.isPending}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guidanceScale" className="text-xs">
                      引导系数 (1-20)
                    </Label>
                    <Input
                      id="guidanceScale"
                      type="number"
                      step="0.5"
                      min="1"
                      max="20"
                      {...register('guidanceScale', { valueAsNumber: true })}
                      disabled={generateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      越高越符合提示词
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="steps" className="text-xs">
                      推理步数 (1-100)
                    </Label>
                    <Input
                      id="steps"
                      type="number"
                      min="1"
                      max="100"
                      {...register('steps', { valueAsNumber: true })}
                      disabled={generateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      越高质量越好但越慢
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seed" className="text-xs">
                      随机种子
                    </Label>
                    <Input
                      id="seed"
                      type="number"
                      placeholder="留空随机"
                      {...register('seed', { valueAsNumber: true })}
                      disabled={generateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      固定值可重现结果
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 生成的图像预览 */}
          {generatedImages.length > 0 && (
            <div className="space-y-3">
              <Label>生成结果</Label>
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative rounded-lg overflow-hidden border bg-muted"
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-auto"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                      <p className="truncate">{image.provider} - {image.model}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={generateMutation.isPending}
            >
              取消
            </Button>
            <Button type="submit" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成图像
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

