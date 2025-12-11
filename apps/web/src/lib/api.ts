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
  }) => api.post('/assistants', data),
  update: (id: string, data: Partial<Parameters<typeof assistantApi.create>[0]>) =>
    api.patch(`/assistants/${id}`, data),
  delete: (id: string) => api.delete(`/assistants/${id}`),
  duplicate: (id: string) => api.post(`/assistants/${id}/duplicate`),
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

