import { create } from 'zustand';

// 类型定义
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

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
  };
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
}));

