'use client';

import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: ReactNode;
}

// 不需要侧边栏的路由
const NO_SIDEBAR_ROUTES = ['/assistants', '/prompts', '/settings'];

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // 判断当前路由是否需要侧边栏
  const showSidebar = !NO_SIDEBAR_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    // 等待 Zustand store 完成水合
    if (_hasHydrated) {
      setIsReady(true);
      // 水合完成后，如果未认证则跳转登录
      if (!isAuthenticated) {
        router.push('/login');
      }
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // 未完成水合或未认证时显示 loading
  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 不显示侧边栏时，显示简化的顶部导航
  if (!showSidebar) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center gap-4 px-6 h-16 border-b border-border bg-card/50">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/chat">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link href="/chat" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Personal AI</span>
          </Link>
        </header>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

export default MainLayout;

