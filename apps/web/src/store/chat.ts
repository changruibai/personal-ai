import { create } from 'zustand';

// 类型定义
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  relatedQuestions?: string[] | null; // 相关问题（仅 assistant 消息）
  createdAt: string;
}

// 列表中使用的简化版 Conversation 类型
export interface ConversationSummary {
  id: string;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
  assistant?: {
    id: string;
    name: string;
    isDefault?: boolean;
  } | null;
}

// 详情中使用的完整 Conversation 类型
export interface Conversation {
  id: string;
  title?: string | null;
  assistantId?: string;
  assistant?: {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    isDefault?: boolean;
  } | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// 优化后的 Store：只管理 UI 状态，不管理服务端数据
// 服务端数据统一由 React Query 管理
interface ChatState {
  // UI 状态
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  
  // UI 状态操作
  setCurrentConversation: (id: string | null) => void;
  setStreaming: (isStreaming: boolean) => void;
  appendStreamContent: (content: string) => void;
  resetStreamContent: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // 初始状态
  currentConversationId: null,
  isStreaming: false,
  streamingContent: '',

  // UI 状态操作
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  
  setStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamContent: (content) =>
    set((state) => ({
      streamingContent: state.streamingContent + content,
    })),

  resetStreamContent: () => set({ streamingContent: '' }),

  // 重置所有状态（用于退出登录）
  reset: () => set({
    currentConversationId: null,
    isStreaming: false,
    streamingContent: '',
  }),
}));

