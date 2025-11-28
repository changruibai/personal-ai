'use client';

import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { User, Palette, Bell, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { userApi } from '@/lib/api';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(1, '请输入用户名'),
  avatar: z.string().url('请输入有效的URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const SettingsPage: FC = () => {
  const { toast } = useToast();
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      avatar: user?.avatar || '',
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileFormData) => userApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data);
      toast({ title: '个人信息已更新' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: '更新失败' });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  const themes = [
    { value: 'light', label: '浅色', icon: '☀️' },
    { value: 'dark', label: '深色', icon: '🌙' },
    { value: 'system', label: '系统', icon: '💻' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">设置</h1>

        <div className="space-y-8">
          {/* 个人信息 */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">个人信息</h2>
                <p className="text-sm text-muted-foreground">
                  管理你的账号信息
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  value={user?.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">用户名</Label>
                <Input
                  id="name"
                  placeholder="你的名字"
                  {...register('name')}
                  disabled={updateProfile.isPending}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">头像URL</Label>
                <Input
                  id="avatar"
                  placeholder="https://example.com/avatar.jpg"
                  {...register('avatar')}
                  disabled={updateProfile.isPending}
                />
                {errors.avatar && (
                  <p className="text-sm text-destructive">
                    {errors.avatar.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                保存更改
              </Button>
            </form>
          </section>

          {/* 外观设置 */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">外观</h2>
                <p className="text-sm text-muted-foreground">
                  自定义应用的外观主题
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                    theme === t.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 其他设置预留区域 */}
          <section className="bg-card border border-border rounded-2xl p-6 opacity-50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">通知</h2>
                <p className="text-sm text-muted-foreground">
                  即将推出...
                </p>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6 opacity-50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">安全</h2>
                <p className="text-sm text-muted-foreground">
                  即将推出...
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

