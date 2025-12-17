'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  Settings2,
  Loader2,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { assistantApi, chatApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { AssistantDialog } from '@/components/assistant/assistant-dialog';

interface Assistant {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  skills?: Record<string, unknown>;
  isDefault: boolean;
  isPublic?: boolean;
  usageCount?: number;
  createdAt: string;
}

const AssistantsPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);

  // 获取助手列表
  const { data: assistants = [], isLoading } = useQuery<Assistant[]>({
    queryKey: ['assistants'],
    queryFn: async () => {
      const res = await assistantApi.getAll();
      return res.data;
    },
  });

  // 删除助手
  const deleteAssistant = useMutation({
    mutationFn: (id: string) => assistantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast({ title: 'AI助手已删除' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: '删除失败' });
    },
  });

  // 复制助手
  const duplicateAssistant = useMutation({
    mutationFn: (id: string) => assistantApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast({ title: 'AI助手已复制' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: '复制失败' });
    },
  });

  // 设为默认
  const setDefault = useMutation({
    mutationFn: (id: string) => assistantApi.update(id, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast({ title: '已设为默认助手' });
    },
  });

  const handleCreate = () => {
    setEditingAssistant(null);
    setDialogOpen(true);
  };

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setDialogOpen(true);
  };

  // 开始与助手对话
  const startChat = useMutation({
    mutationFn: async (assistantId: string) => {
      const res = await chatApi.createConversation({ assistantId });
      return res.data;
    },
    onSuccess: (conversation) => {
      router.push(`/chat/${conversation.id}`);
    },
    onError: () => {
      toast({ variant: 'destructive', title: '创建对话失败' });
    },
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI 助手</h1>
            <p className="text-muted-foreground">
              创建和管理你的个性化AI助手，定制专属技能和性格
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            创建助手
          </Button>
        </div>

        {/* Assistant Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : assistants.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">还没有AI助手</h3>
            <p className="text-muted-foreground mb-6">
              创建你的第一个AI助手，定制专属的对话体验
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              创建助手
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {assistants.map((assistant, index) => (
                <motion.div
                  key={assistant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors"
                >
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {assistant.isPublic && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs">
                        <Globe className="h-3 w-3" />
                        公开
                      </div>
                    )}
                    {assistant.isDefault && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        默认
                      </div>
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {assistant.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {assistant.model}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                    {assistant.description || '暂无描述'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>温度: {assistant.temperature}</span>
                    <span>Token: {assistant.maxTokens}</span>
                    {assistant.isPublic && assistant.usageCount !== undefined && assistant.usageCount > 0 && (
                      <span>{assistant.usageCount} 次使用</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => startChat.mutate(assistant.id)}
                      disabled={startChat.isPending}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      开始对话
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(assistant)}
                      title="编辑"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateAssistant.mutate(assistant.id)}
                      title="复制"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {!assistant.isDefault && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDefault.mutate(assistant.id)}
                        title="设为默认"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteAssistant.mutate(assistant.id)}
                      title="删除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Assistant Dialog */}
      <AssistantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assistant={editingAssistant}
      />
    </div>
  );
};

export default AssistantsPage;

