'use client';

import type { FC } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const HomePage: FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: Bot,
      title: '智能对话',
      description: '基于先进AI模型，提供流畅自然的对话体验',
    },
    {
      icon: Sparkles,
      title: '个性化定制',
      description: '自定义AI助手的性格、技能和专业领域',
    },
    {
      icon: Zap,
      title: 'Prompt优化',
      description: '丰富的Prompt模板库，快速提升AI输出质量',
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '数据加密存储，保护您的隐私安全',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* 导航栏 */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Personal AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>开始使用</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <main className="relative z-10">
        <section className="container mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              打造你的
              <br />
              专属 AI 助手
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Personal AI 让你轻松创建个性化的AI助手，定制专属技能，
              优化对话体验，让AI真正懂你所需。
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="px-8 animate-pulse-glow">
                  <Sparkles className="w-5 h-5 mr-2" />
                  免费开始
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8">
                  已有账号
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* 功能特性 */}
        <section className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-center mb-12">
              强大功能，简单易用
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA 区域 */}
        <section className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center p-12 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20"
          >
            <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              立即注册，免费体验Personal AI的强大功能
            </p>
            <Link href="/register">
              <Button size="lg" className="px-12">
                立即开始
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 Personal AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

