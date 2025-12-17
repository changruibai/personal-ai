import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// User API
export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.patch('/user/profile', data),
};

// Chat API
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getConversation: (id: string) => api.get(`/chat/conversations/${id}`),
  createConversation: (data: { title?: string; assistantId?: string }) =>
    api.post('/chat/conversations', data),
  deleteConversation: (id: string) => api.delete(`/chat/conversations/${id}`),
  updateConversationTitle: (id: string, title: string) =>
    api.put(`/chat/conversations/${id}/title`, { title }),
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { content }),
  savePartialMessage: (conversationId: string, content: string) =>
    api.post(`/chat/conversations/${conversationId}/messages/save-partial`, { content }),
  sendMessageStream: async function* (
    conversationId: string,
    content: string,
    onChunk?: (chunk: string) => void,
    onRelatedQuestions?: (questions: string[]) => void,
    signal?: AbortSignal,
  ) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ content }),
        signal,
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }));
      throw new Error(error.message || '请求失败');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              // 处理聊天内容
              if (parsed.content) {
                onChunk?.(parsed.content);
                yield { type: 'content', data: parsed.content };
              }
              // 处理相关问题
              if (parsed.relatedQuestions) {
                onRelatedQuestions?.(parsed.relatedQuestions);
                yield { type: 'relatedQuestions', data: parsed.relatedQuestions };
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
  // 编辑消息并重新生成回复（流式）
  editMessageStream: async function* (
    conversationId: string,
    messageId: string,
    content: string,
    onChunk?: (chunk: string) => void,
    onRelatedQuestions?: (questions: string[]) => void,
    signal?: AbortSignal,
  ) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages/${messageId}/edit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ content }),
        signal,
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }));
      throw new Error(error.message || '请求失败');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                onChunk?.(parsed.content);
                yield { type: 'content', data: parsed.content };
              }
              if (parsed.relatedQuestions) {
                onRelatedQuestions?.(parsed.relatedQuestions);
                yield { type: 'relatedQuestions', data: parsed.relatedQuestions };
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

// Assistant API
export const assistantApi = {
  getAll: () => api.get('/assistants'),
  getOne: (id: string) => api.get(`/assistants/${id}`),
  getDefault: () => api.get('/assistants/default'),
  create: (data: {
    name: string;
    description?: string;
    systemPrompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    skills?: Record<string, unknown>;
    isDefault?: boolean;
    isPublic?: boolean;
  }) => api.post('/assistants', data),
  update: (id: string, data: Partial<Parameters<typeof assistantApi.create>[0]>) =>
    api.patch(`/assistants/${id}`, data),
  delete: (id: string) => api.delete(`/assistants/${id}`),
  duplicate: (id: string) => api.post(`/assistants/${id}/duplicate`),

  // 助手市场 API
  getMarket: (params?: { search?: string; sortBy?: 'popular' | 'newest'; limit?: number; offset?: number }) =>
    api.get('/assistants/market', { params }),
  getMarketAssistant: (id: string) => api.get(`/assistants/market/${id}`),
  getFavorites: () => api.get('/assistants/favorites'),
  favorite: (id: string) => api.post(`/assistants/market/${id}/favorite`),
  unfavorite: (id: string) => api.delete(`/assistants/market/${id}/favorite`),
  usePublicAssistant: (id: string) => api.post(`/assistants/market/${id}/use`),
  copyPublicAssistant: (id: string) => api.post(`/assistants/market/${id}/copy`),
};

// Prompt API
export const promptApi = {
  getPublic: (params?: { category?: string; search?: string }) =>
    api.get('/prompts/public', { params }),
  getMy: (category?: string) =>
    api.get('/prompts/my', { params: { category } }),
  getOne: (id: string) => api.get(`/prompts/${id}`),
  getCategories: () => api.get('/prompts/categories'),
  create: (data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => api.post('/prompts', data),
  update: (id: string, data: Partial<Parameters<typeof promptApi.create>[0]>) =>
    api.patch(`/prompts/${id}`, data),
  delete: (id: string) => api.delete(`/prompts/${id}`),
  use: (id: string) => api.post(`/prompts/${id}/use`),
  copy: (id: string) => api.post(`/prompts/${id}/copy`),
};

// 简历模板类型定义（爬取的完整模板）
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  source: string; // 来源网站
  sourceUrl: string; // 原始链接
  previewImage: string;
  html: string; // 完整 HTML 模板
  css: string; // CSS 样式
  category: 'professional' | 'creative' | 'minimal' | 'modern' | 'academic';
  placeholders: string[]; // 模板中的占位符列表
  crawledAt: Date;
}

// Resume API
export const resumeApi = {
  // 解析简历文本
  parse: (content: string) => api.post('/resume/parse', { content }),

  // 上传并解析简历文件 (支持 txt, md, docx, pdf)
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    const response = await fetch(`${API_BASE_URL}/resume/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '上传失败' }));
      throw new Error(error.message || '上传失败');
    }

    return response.json();
  },

  // 获取优化建议
  getSuggestions: (content: string) =>
    api.post('/resume/suggestions', { content }),

  // 优化简历（流式）
  optimizeStream: async function* (
    data: {
      content: string;
      instruction?: string;
      targetPosition?: string;
      style?: 'professional' | 'creative' | 'academic' | 'minimal';
    },
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal,
  ) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/resume/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }));
      throw new Error(error.message || '请求失败');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                onChunk?.(parsed.content);
                yield parsed.content;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  // 导出简历 HTML
  exportHTML: (
    content: string,
    style?: 'professional' | 'creative' | 'academic' | 'minimal',
  ) => api.post('/resume/export', { content, style }),

  // 导出简历 Word 文档
  exportDocx: async (
    content: string,
    style?: 'professional' | 'creative' | 'academic' | 'minimal',
  ) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/resume/export/docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ content, style }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '导出失败' }));
      throw new Error(error.message || '导出失败');
    }

    return response.blob();
  },

  // ============= 模板相关 API =============

  // 获取所有模板（内置 + 爬取的）
  getTemplates: (params?: {
    category?: ResumeTemplate['category'];
    source?: 'builtin' | 'crawled' | 'all';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.source) queryParams.append('source', params.source);
    const query = queryParams.toString();
    return api.get<ResumeTemplate[]>(`/resume/templates${query ? `?${query}` : ''}`);
  },

  // 获取单个模板
  getTemplate: (id: string) => api.get<ResumeTemplate>(`/resume/templates/${id}`),

  // 爬取新模板
  crawlTemplates: () => api.post('/resume/templates/crawl'),

  // 预览模板效果
  previewTemplate: (templateId: string, content: string) =>
    api.post(`/resume/templates/${templateId}/preview`, { content }),

  // 使用模板导出 HTML
  exportWithTemplate: (content: string, templateId: string) =>
    api.post('/resume/export/template', { content, templateId }),

  // 使用模板导出 Word
  exportWithTemplateDocx: async (content: string, templateId: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/resume/export/template/docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ content, templateId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '导出失败' }));
      throw new Error(error.message || '导出失败');
    }

    return response.blob();
  },
};

// Image Generation API
export const imageApi = {
  generate: (data: {
    prompt: string;
    provider: 'replicate' | 'huggingface';
    size?: '512x512' | '512x768' | '768x512' | '1024x1024';
    negativePrompt?: string;
    numImages?: number;
    guidanceScale?: number;
    steps?: number;
    seed?: number;
  }) => api.post('/image/generate', data),
  generateInConversation: (data: {
    conversationId: string;
    prompt: string;
    provider: 'replicate' | 'huggingface';
    size?: '512x512' | '512x768' | '768x512' | '1024x1024';
    negativePrompt?: string;
    numImages?: number;
    guidanceScale?: number;
    steps?: number;
    seed?: number;
  }) => api.post('/image/generate-in-conversation', data),
  getModels: (provider: 'replicate' | 'huggingface') =>
    api.get('/image/models', { params: { provider } }),
};

