'use client';

import type { FC } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  MessageSquare,
  Settings,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Trash2,
  Edit2,
  Sparkles,
  Wand2,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useChatStore, type ConversationSummary } from '@/store/chat';
import { chatApi, assistantApi } from '@/lib/api';
import { AssistantDialog } from '@/components/assistant/assistant-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export const Sidebar: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { reset: resetChatStore } = useChatStore();
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showAssistantDialog, setShowAssistantDialog] = useState(false);

  // 获取默认助手
  const { data: defaultAssistant } = useQuery<Assistant | null>({
    queryKey: ['defaultAssistant'],
    queryFn: async () => {
      try {
        const res = await assistantApi.getDefault();
        return res.data;
      } catch {
        return null;
      }
    },
  });

  // 使用 React Query 获取会话列表
  const { data: conversations = [] } = useQuery<ConversationSummary[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatApi.getConversations();
      return res.data;
    },
  });

  // 删除会话 mutation
  const deleteConversation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (pathname === `/chat/${id}`) {
        router.push('/chat');
      }
    },
  });

  // 更新会话标题 mutation
  const updateTitle = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      chatApi.updateConversationTitle(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setEditingId(null);
    },
  });

  // 删除会话处理
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConversation.mutate(id);
  };

  // 开始编辑标题
  const handleStartEdit = (id: string, title: string | null | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title || '新对话');
  };

  // 保存标题
  const handleSaveTitle = (id: string) => {
    updateTitle.mutate({ id, title: editTitle });
  };

  // 新建对话
  const handleNewChat = () => {
    router.push('/chat');
  };

  // 退出登录
  const handleLogout = () => {
    queryClient.clear();
    resetChatStore();
    logout();
    router.push('/login');
  };

  return (
    <>
      <aside
        className={cn(
          'relative flex h-full flex-col border-r border-border bg-card/50 transition-all duration-300',
          collapsed ? 'w-16' : 'w-72',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center border-b border-border p-4',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <Link href="/chat" className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && <span className="text-lg font-bold">Personal AI</span>}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 折叠状态下的展开按钮 */}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-16 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-sm"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}

        {/* New Chat Button */}
        <div className={cn('p-3', collapsed && 'flex justify-center')}>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleNewChat}
                  className={cn('w-full gap-2', collapsed && 'h-10 w-10 justify-center p-0')}
                  variant="default"
                  size={collapsed ? 'icon' : 'default'}
                >
                  <Plus className={cn('flex-shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
                  {!collapsed && '新对话'}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>新对话</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 历史会话列表 - 折叠时隐藏 */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              历史会话
            </div>
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  onMouseEnter={() => setHoveredId(conversation.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors',
                      pathname === `/chat/${conversation.id}`
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    {editingId === conversation.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(conversation.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveTitle(conversation.id);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        className="flex-1 border-b border-primary bg-transparent text-sm outline-none"
                        autoFocus
                        onClick={(e) => e.preventDefault()}
                      />
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm">
                            {conversation.title || '新对话'}
                          </span>
                          {conversation.assistant && !conversation.assistant.isDefault && (
                            <span className="block truncate text-xs text-muted-foreground/70">
                              {conversation.assistant.name}
                            </span>
                          )}
                        </div>
                        {hoveredId === conversation.id && (
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) =>
                                handleStartEdit(conversation.id, conversation.title, e)
                              }
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(conversation.id, e)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              ))}

              {conversations.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">暂无对话记录</div>
              )}
            </div>
          </div>
        )}

        {/* 折叠时的占位区域 */}
        {collapsed && <div className="flex-1" />}

        {/* 底部功能区 */}
        <div className="border-t border-border p-2">
          {/* 用户信息 - 点击显示菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent',
                  collapsed ? 'flex-col justify-center' : '',
                )}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium">{user?.name || user?.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={collapsed ? 'right' : 'top'}
              align={collapsed ? 'start' : 'start'}
              className="w-56"
            >
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setShowAssistantDialog(true)}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                修改默认助手
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/assistants">
                  <Bot className="mr-2 h-4 w-4" />
                  AI助手管理
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/prompts">
                  <FileText className="mr-2 h-4 w-4" />
                  Prompt库
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* 默认助手编辑对话框 */}
      <AssistantDialog
        open={showAssistantDialog}
        onOpenChange={setShowAssistantDialog}
        assistant={defaultAssistant || null}
      />
    </>
  );
};
