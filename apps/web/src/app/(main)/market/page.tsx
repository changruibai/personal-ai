'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Search,
  Heart,
  MessageSquare,
  Copy,
  Loader2,
  Users,
  TrendingUp,
  Clock,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { assistantApi, chatApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface MarketAssistant {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  usageCount: number;
  favoriteCount: number;
  isFavorited: boolean;
  isOwner: boolean;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

interface MarketResponse {
  data: MarketAssistant[];
  total: number;
  limit: number;
  offset: number;
}

const MarketPage: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');
  const [activeTab, setActiveTab] = useState<'market' | 'favorites'>('market');

  // 获取市场助手列表
  const { data: marketData, isLoading: isLoadingMarket } = useQuery<MarketResponse>({
    queryKey: ['market-assistants', search, sortBy],
    queryFn: async () => {
      const res = await assistantApi.getMarket({ search, sortBy });
      return res.data;
    },
    enabled: activeTab === 'market',
  });

  // 获取收藏列表
  const { data: favorites = [], isLoading: isLoadingFavorites } = useQuery<MarketAssistant[]>({
    queryKey: ['favorite-assistants'],
    queryFn: async () => {
      const res = await assistantApi.getFavorites();
      return res.data;
    },
    enabled: activeTab === 'favorites',
  });

  // 收藏/取消收藏
  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorited }: { id: string; isFavorited: boolean }) => {
      if (isFavorited) {
        return assistantApi.unfavorite(id);
      } else {
        return assistantApi.favorite(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-assistants'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-assistants'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: '操作失败' });
    },
  });

  // 开始对话
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

  // 复制助手到自己账户
  const copyAssistant = useMutation({
    mutationFn: (id: string) => assistantApi.copyPublicAssistant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['market-assistants'] });
      toast({ title: '助手已复制到你的账户' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: '复制失败' });
    },
  });

  const assistants = activeTab === 'market' ? marketData?.data || [] : favorites;
  const isLoading = activeTab === 'market' ? isLoadingMarket : isLoadingFavorites;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">助手市场</h1>
          <p className="text-muted-foreground">发现和使用其他用户分享的优质 AI 助手</p>
        </div>

        {/* Tabs & Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'market' ? 'default' : 'outline'}
              onClick={() => setActiveTab('market')}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              探索市场
            </Button>
            <Button
              variant={activeTab === 'favorites' ? 'default' : 'outline'}
              onClick={() => setActiveTab('favorites')}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              我的收藏
            </Button>
          </div>

          {/* Search & Sort */}
          {activeTab === 'market' && (
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索助手..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortBy(sortBy === 'popular' ? 'newest' : 'popular')}
                title={sortBy === 'popular' ? '按热度排序' : '按时间排序'}
              >
                {sortBy === 'popular' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : assistants.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              {activeTab === 'market' ? (
                <Bot className="h-8 w-8 text-primary" />
              ) : (
                <Heart className="h-8 w-8 text-primary" />
              )}
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              {activeTab === 'market' ? '暂无公开助手' : '暂无收藏'}
            </h3>
            <p className="text-muted-foreground">
              {activeTab === 'market'
                ? '成为第一个分享助手的人吧！'
                : '去市场探索有趣的助手并收藏吧'}
            </p>
            {activeTab === 'favorites' && (
              <Button onClick={() => setActiveTab('market')} className="mt-4">
                探索市场
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {assistants.map((assistant, index) => (
                <motion.div
                  key={assistant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
                >
                  {/* Owner Badge */}
                  {assistant.isOwner && (
                    <div className="absolute right-4 top-4">
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                        <Star className="h-3 w-3 fill-current" />
                        我的
                      </div>
                    </div>
                  )}

                  {/* Avatar & Name */}
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold">{assistant.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">
                        by {assistant.user?.name || '匿名用户'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-4 line-clamp-2 min-h-[40px] text-sm text-muted-foreground">
                    {assistant.description || '暂无描述'}
                  </p>

                  {/* Stats */}
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {assistant.usageCount} 次使用
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {assistant.favoriteCount} 收藏
                    </span>
                  </div>

                  {/* Model Info */}
                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2 py-0.5">{assistant.model}</span>
                    <span>温度: {assistant.temperature}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => startChat.mutate(assistant.id)}
                      disabled={startChat.isPending}
                    >
                      <MessageSquare className="mr-1 h-3 w-3" />
                      开始对话
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        toggleFavorite.mutate({
                          id: assistant.id,
                          isFavorited: assistant.isFavorited,
                        })
                      }
                      title={assistant.isFavorited ? '取消收藏' : '收藏'}
                    >
                      <Heart
                        className={cn(
                          'h-3 w-3',
                          assistant.isFavorited && 'fill-red-500 text-red-500',
                        )}
                      />
                    </Button>
                    {!assistant.isOwner && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyAssistant.mutate(assistant.id)}
                        title="复制到我的助手"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Stats */}
        {activeTab === 'market' && marketData && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            共 {marketData.total} 个公开助手
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPage;
