'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bot,
  MessageSquare,
  Settings,
  Sparkles,
  FileText,
  LogOut,
  ChevronLeft,
  Plus,
  User,
  Trash2,
  Edit2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { chatApi } from '@/lib/api';

const menuItems = [
  { icon: MessageSquare, label: '对话', href: '/chat' },
  { icon: Bot, label: 'AI助手', href: '/assistants' },
  { icon: FileText, label: 'Prompt库', href: '/prompts' },
  { icon: Settings, label: '设置', href: '/settings' },
];

export const Sidebar: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { conversations, currentConversationId, setConversations, removeConversation, setCurrentConversation } = useChatStore();
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 加载会话列表
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data } = await chatApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  };

  // 删除会话
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await chatApi.deleteConversation(id);
      removeConversation(id);
      
      // 如果删除的是当前会话，跳转到新会话
      if (currentConversationId === id) {
        router.push('/chat');
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  // 开始编辑标题
  const handleStartEdit = (id: string, title: string | null | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title || '新对话');
  };

  // 保存标题
  const handleSaveTitle = async (id: string) => {
    try {
      await chatApi.updateConversationTitle(id, editTitle);
      await loadConversations();
      setEditingId(null);
    } catch (error) {
      console.error('更新标题失败:', error);
    }
  };

  // 创建新对话
  const handleNewChat = async () => {
    try {
      const { data } = await chatApi.createConversation({});
      router.push(`/chat?id=${data.id}`);
      await loadConversations();
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg">Personal AI</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={handleNewChat}
          className={cn('w-full gap-2', collapsed && 'px-0')}
          variant="default"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && '新对话'}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}

        {/* 会话列表 */}
        {!collapsed && pathname.startsWith('/chat') && (
          <div className="mt-4 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              最近对话
            </div>
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/chat?id=${conversation.id}`}
                onMouseEnter={() => setHoveredId(conversation.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    currentConversationId === conversation.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
                      className="flex-1 bg-transparent border-b border-primary outline-none"
                      autoFocus
                      onClick={(e) => e.preventDefault()}
                    />
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate text-sm">
                        {conversation.title || '新对话'}
                      </span>
                      {hoveredId === conversation.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => handleStartEdit(conversation.id, conversation.title, e)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
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
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-border">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={logout}
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};

