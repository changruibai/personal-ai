'use client';

import type { FC } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Settings,
  FileText,
  LogOut,
  User,
  Menu,
  X,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssistantDialog } from '@/components/assistant/assistant-dialog';
import { assistantApi } from '@/lib/api';
import { useChatStore } from '@/store/chat';

const menuItems = [
  { icon: Bot, label: 'AI助手', href: '/assistants' },
  { icon: FileText, label: 'Prompt库', href: '/prompts' },
  { icon: Settings, label: '设置', href: '/settings' },
];

interface Assistant {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  skills?: {
    imageGeneration?: boolean;
    codeExecution?: boolean;
    webSearch?: boolean;
  };
  relatedQuestionsEnabled?: boolean;
  relatedQuestionsMode?: 'llm' | 'template' | 'disabled';
  relatedQuestionsCount?: number;
}

export const Header: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { reset: resetChatStore } = useChatStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const handleLogout = () => {
    // 清除所有缓存数据
    queryClient.clear();
    // 重置聊天状态
    resetChatStore();
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* 桌面端顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center justify-between px-4">
          {/* 左侧 Logo 和标题 */}
          <Link href="/chat" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-bold text-lg sm:inline-block">Personal AI</span>
          </Link>

          {/* 中间导航菜单 - 桌面端 */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* 右侧用户菜单 */}
          <div className="flex items-center gap-2">
            {/* 桌面端用户菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <span className="max-w-32 truncate text-sm">
                    {user?.name || user?.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowAssistantDialog(true)}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  修改默认助手
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* 移动端展开菜单 */}
        {mobileMenuOpen && (
          <div className="border-t border-border md:hidden">
            <nav className="space-y-1 p-2">
              {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
            
            <div className="border-t border-border p-2">
              {/* 移动端修改默认助手按钮 */}
              <button
                onClick={() => {
                  setShowAssistantDialog(true);
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Wand2 className="h-5 w-5" />
                <span>修改默认助手</span>
              </button>
            </div>

            <div className="border-t border-border p-2">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="flex-shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 默认助手编辑对话框 */}
      <AssistantDialog
        open={showAssistantDialog}
        onOpenChange={setShowAssistantDialog}
        assistant={defaultAssistant || null}
      />
    </>
  );
};

