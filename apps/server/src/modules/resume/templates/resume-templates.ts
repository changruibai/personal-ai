/**
 * 简历模板定义
 */
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'modern' | 'academic';
  previewImage: string; // 预览图片 URL
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    headerBg: string;
    headerText: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right';
  features: string[];
  popularity: number;
  isNew?: boolean;
  isPremium?: boolean;
}

/**
 * 内置简历模板集合
 */
export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic-professional',
    name: '经典专业',
    description: '传统稳重的专业风格，适合金融、法律、咨询等行业',
    category: 'professional',
    previewImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=560&fit=crop',
    colors: {
      primary: '#1e3a5f',
      secondary: '#2563eb',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#333333',
      headerBg: '#1e3a5f',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Noto Serif SC", "Times New Roman", serif',
      body: '"Noto Sans SC", "Helvetica Neue", Arial, sans-serif',
    },
    layout: 'single-column',
    features: ['清晰的层级结构', '传统排版', '适合打印'],
    popularity: 95,
  },
  {
    id: 'modern-tech',
    name: '现代科技',
    description: '时尚现代的设计风格，适合互联网、IT、科技公司',
    category: 'modern',
    previewImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=560&fit=crop',
    colors: {
      primary: '#0891b2',
      secondary: '#06b6d4',
      accent: '#22d3ee',
      background: '#f8fafc',
      text: '#334155',
      headerBg: 'linear-gradient(135deg, #0891b2, #2563eb)',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Inter", "SF Pro Display", sans-serif',
      body: '"Inter", "SF Pro Text", sans-serif',
    },
    layout: 'two-column',
    features: ['双栏布局', '渐变色彩', '技能可视化'],
    popularity: 92,
    isNew: true,
  },
  {
    id: 'creative-gradient',
    name: '创意渐变',
    description: '大胆创新的设计，适合设计师、创意行业',
    category: 'creative',
    previewImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=560&fit=crop',
    colors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#faf5ff',
      text: '#4c1d95',
      headerBg: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Poppins", "Segoe UI", sans-serif',
      body: '"Poppins", "Segoe UI", sans-serif',
    },
    layout: 'sidebar-left',
    features: ['左侧边栏', '渐变背景', '个性化设计'],
    popularity: 88,
  },
  {
    id: 'minimal-clean',
    name: '简约清爽',
    description: '极简主义设计，专注内容，减少干扰',
    category: 'minimal',
    previewImage: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&h=560&fit=crop',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#9ca3af',
      background: '#ffffff',
      text: '#1f2937',
      headerBg: '#111827',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Inter", system-ui, sans-serif',
      body: '"Inter", system-ui, sans-serif',
    },
    layout: 'single-column',
    features: ['极简设计', '突出内容', '易于阅读'],
    popularity: 90,
  },
  {
    id: 'academic-scholar',
    name: '学术研究',
    description: '严谨专业的学术风格，适合教育、研究机构',
    category: 'academic',
    previewImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=560&fit=crop',
    colors: {
      primary: '#065f46',
      secondary: '#059669',
      accent: '#10b981',
      background: '#f9fafb',
      text: '#1f2937',
      headerBg: '#065f46',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Noto Serif SC", "Georgia", serif',
      body: '"Noto Sans SC", "Arial", sans-serif',
    },
    layout: 'single-column',
    features: ['学术排版', '引用格式', '出版物列表'],
    popularity: 85,
  },
  {
    id: 'elegant-luxury',
    name: '优雅高端',
    description: '高端精致的设计，适合奢侈品、时尚行业',
    category: 'creative',
    previewImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=560&fit=crop',
    colors: {
      primary: '#78350f',
      secondary: '#b45309',
      accent: '#d97706',
      background: '#fffbeb',
      text: '#451a03',
      headerBg: 'linear-gradient(135deg, #78350f, #b45309)',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Playfair Display", "Georgia", serif',
      body: '"Lato", "Helvetica Neue", sans-serif',
    },
    layout: 'sidebar-right',
    features: ['金色点缀', '优雅字体', '精致排版'],
    popularity: 82,
    isPremium: true,
  },
  {
    id: 'fresh-startup',
    name: '清新创业',
    description: '活力十足的设计，适合初创公司、新兴行业',
    category: 'modern',
    previewImage: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=400&h=560&fit=crop',
    colors: {
      primary: '#059669',
      secondary: '#34d399',
      accent: '#6ee7b7',
      background: '#ecfdf5',
      text: '#064e3b',
      headerBg: 'linear-gradient(135deg, #059669, #34d399)',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Nunito", "Segoe UI", sans-serif',
      body: '"Nunito", "Segoe UI", sans-serif',
    },
    layout: 'two-column',
    features: ['清新配色', '圆角设计', '图标点缀'],
    popularity: 87,
    isNew: true,
  },
  {
    id: 'corporate-executive',
    name: '企业高管',
    description: '沉稳大气的设计，适合高级管理层',
    category: 'professional',
    previewImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=560&fit=crop',
    colors: {
      primary: '#1e293b',
      secondary: '#334155',
      accent: '#475569',
      background: '#ffffff',
      text: '#0f172a',
      headerBg: '#0f172a',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Merriweather", "Georgia", serif',
      body: '"Source Sans Pro", "Arial", sans-serif',
    },
    layout: 'single-column',
    features: ['高端商务', '强调成就', '数据可视化'],
    popularity: 84,
  },
  {
    id: 'colorful-designer',
    name: '多彩设计师',
    description: '充满活力的多彩设计，适合平面设计、UI设计师',
    category: 'creative',
    previewImage: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=560&fit=crop',
    colors: {
      primary: '#f43f5e',
      secondary: '#f97316',
      accent: '#facc15',
      background: '#fff1f2',
      text: '#881337',
      headerBg: 'linear-gradient(135deg, #f43f5e, #f97316, #facc15)',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Quicksand", "Arial Rounded MT", sans-serif',
      body: '"Quicksand", "Arial Rounded MT", sans-serif',
    },
    layout: 'sidebar-left',
    features: ['多彩渐变', '创意布局', '作品集链接'],
    popularity: 80,
  },
  {
    id: 'dark-developer',
    name: '暗黑开发者',
    description: '深色主题设计，适合程序员、技术人员',
    category: 'modern',
    previewImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=560&fit=crop',
    colors: {
      primary: '#a855f7',
      secondary: '#22d3ee',
      accent: '#4ade80',
      background: '#0f172a',
      text: '#e2e8f0',
      headerBg: '#020617',
      headerText: '#f8fafc',
    },
    fonts: {
      heading: '"JetBrains Mono", "Fira Code", monospace',
      body: '"Inter", "Roboto", sans-serif',
    },
    layout: 'two-column',
    features: ['深色主题', '代码风格', '技术栈展示'],
    popularity: 89,
    isNew: true,
  },
  {
    id: 'soft-pastel',
    name: '柔和马卡龙',
    description: '柔和的马卡龙色系，适合女性求职者',
    category: 'creative',
    previewImage: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=400&h=560&fit=crop',
    colors: {
      primary: '#c084fc',
      secondary: '#f0abfc',
      accent: '#fda4af',
      background: '#fdf4ff',
      text: '#6b21a8',
      headerBg: 'linear-gradient(135deg, #c084fc, #f0abfc)',
      headerText: '#ffffff',
    },
    fonts: {
      heading: '"Comfortaa", "Arial Rounded MT", sans-serif',
      body: '"Comfortaa", "Arial Rounded MT", sans-serif',
    },
    layout: 'sidebar-right',
    features: ['柔和色调', '圆润字体', '温馨设计'],
    popularity: 78,
  },
  {
    id: 'newspaper-classic',
    name: '报纸经典',
    description: '复古报纸风格，独特的排版设计',
    category: 'creative',
    previewImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=560&fit=crop',
    colors: {
      primary: '#292524',
      secondary: '#44403c',
      accent: '#78716c',
      background: '#fafaf9',
      text: '#1c1917',
      headerBg: '#292524',
      headerText: '#fafaf9',
    },
    fonts: {
      heading: '"Playfair Display", "Times New Roman", serif',
      body: '"Lora", "Georgia", serif',
    },
    layout: 'two-column',
    features: ['复古风格', '多栏排版', '独特设计'],
    popularity: 75,
    isPremium: true,
  },
];

/**
 * 获取所有模板
 */
export function getAllTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES;
}

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(category: ResumeTemplate['category']): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter(t => t.category === category);
}

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find(t => t.id === id);
}

/**
 * 获取热门模板
 */
export function getPopularTemplates(limit = 6): ResumeTemplate[] {
  return [...RESUME_TEMPLATES].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

/**
 * 获取新模板
 */
export function getNewTemplates(): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter(t => t.isNew);
}
