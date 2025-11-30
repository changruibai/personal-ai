'use client';

import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 3 * 60 * 1000, // 3分钟内使用缓存，避免频繁请求
            cacheTime: 10 * 60 * 1000, // 缓存保留10分钟
            refetchOnWindowFocus: false, // 防止切换窗口时重新请求
            refetchOnMount: false, // 防止组件挂载时重复请求（如果数据未过期）
            retry: 1, // 失败重试1次
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

