'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Globe,
  Lock,
  Tag,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { promptApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { PromptDialog } from '@/components/prompt/prompt-dialog';

interface Prompt {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
  };
}

const PromptsPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // 获取我的Prompt
  const { data: myPrompts = [], isLoading: loadingMy } = useQuery<Prompt[]>({
    queryKey: ['prompts', 'my'],
    queryFn: async () => {
      const res = await promptApi.getMy();
      return res.data;
    },
    enabled: activeTab === 'my',
  });

  // 获取公开Prompt
  const { data: publicPrompts = [], isLoading: loadingPublic } = useQuery<Prompt[]>({
    queryKey: ['prompts', 'public', search],
    queryFn: async () => {
      const res = await promptApi.getPublic({ search: search || undefined });
      return res.data;
    },
    enabled: activeTab === 'public',
  });

  const prompts = activeTab === 'my' ? myPrompts : publicPrompts;
  const isLoading = activeTab === 'my' ? loadingMy : loadingPublic;

  // 删除Prompt
  const deletePrompt = useMutation({
    mutationFn: (id: string) => promptApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({ title: 'Prompt已删除' });
    },
  });

  // 复制Prompt
  const copyPrompt = useMutation({
    mutationFn: (id: string) => promptApi.copy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', 'my'] });
      toast({ title: 'Prompt已复制到我的库' });
    },
  });

  // 使用Prompt
  const usePrompt = useMutation({
    mutationFn: (id: string) => promptApi.use(id),
    onSuccess: (_, id) => {
      const prompt = prompts.find((p) => p.id === id);
      if (prompt) {
        navigator.clipboard.writeText(prompt.content);
        toast({ title: 'Prompt已复制到剪贴板' });
      }
    },
  });

  const handleCreate = () => {
    setEditingPrompt(null);
    setDialogOpen(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setDialogOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Prompt 库</h1>
            <p className="text-muted-foreground">
              管理和分享你的Prompt模板，提升AI对话质量
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            创建Prompt
          </Button>
        </div>

        {/* Tabs & Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'my' ? 'default' : 'outline'}
              onClick={() => setActiveTab('my')}
            >
              <Lock className="h-4 w-4 mr-2" />
              我的Prompt
            </Button>
            <Button
              variant={activeTab === 'public' ? 'default' : 'outline'}
              onClick={() => setActiveTab('public')}
            >
              <Globe className="h-4 w-4 mr-2" />
              公开Prompt
            </Button>
          </div>

          {activeTab === 'public' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索Prompt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {/* Prompt Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {activeTab === 'my' ? '还没有Prompt' : '没有找到Prompt'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'my'
                ? '创建你的第一个Prompt模板'
                : '尝试其他搜索关键词'}
            </p>
            {activeTab === 'my' && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                创建Prompt
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <AnimatePresence>
              {prompts.map((prompt, index) => (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{prompt.title}</h3>
                        {prompt.category && (
                          <span className="text-xs text-muted-foreground">
                            {prompt.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {prompt.isPublic ? (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px]">
                    {prompt.content}
                  </p>

                  {/* Tags */}
                  {prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{prompt.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      使用 {prompt.usageCount} 次
                    </span>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => usePrompt.mutate(prompt.id)}
                      >
                        使用
                      </Button>
                      {activeTab === 'my' ? (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(prompt)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deletePrompt.mutate(prompt.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyPrompt.mutate(prompt.id)}
                          title="复制到我的库"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Prompt Dialog */}
      <PromptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        prompt={editingPrompt}
      />
    </div>
  );
};

export default PromptsPage;

