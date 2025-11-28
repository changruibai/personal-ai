# Personal AI - 个性化 AI 对话应用

一套前后端分离的 AI 应用，支持与 AI 对话、个性化定制 AI 助手、Prompt 优化等功能。

## 🚀 技术栈

### 后端 (NestJS)
- **框架**: NestJS 10
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + Passport.js
- **API 文档**: Swagger
- **实时通信**: Socket.io
- **AI 集成**: OpenAI SDK

### 前端 (Next.js)
- **框架**: Next.js 14 (App Router)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **请求**: TanStack Query + Axios
- **表单**: React Hook Form + Zod
- **动画**: Framer Motion

### 包管理
- **pnpm** (Monorepo 架构)

## 📁 项目结构

```
personal-ai/
├── apps/
│   ├── server/          # NestJS 后端服务
│   │   ├── prisma/      # Prisma 数据库模型
│   │   └── src/
│   │       ├── modules/ # 功能模块
│   │       │   ├── auth/       # 认证模块
│   │       │   ├── user/       # 用户模块
│   │       │   ├── chat/       # 对话模块
│   │       │   ├── assistant/  # AI助手模块
│   │       │   └── prompt/     # Prompt模块
│   │       └── prisma/  # Prisma 服务
│   │
│   └── web/             # Next.js 前端应用
│       └── src/
│           ├── app/     # 页面路由
│           ├── components/  # 组件
│           ├── lib/     # 工具函数
│           └── store/   # 状态管理
│
├── packages/            # 共享包（可扩展）
├── pnpm-workspace.yaml  # pnpm 工作空间配置
└── package.json         # 根配置
```

## 🛠️ 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8
- PostgreSQL

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

后端配置：
```bash
cd apps/server
cp env.example .env
# 编辑 .env 文件，配置数据库连接和 OpenAI API Key
```

前端配置：
```bash
cd apps/web
# 创建 .env.local 文件
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
```

### 3. 初始化数据库

```bash
cd apps/server
pnpm prisma:generate
pnpm prisma:migrate
```

### 4. 启动开发服务

```bash
# 在根目录
pnpm dev
# 或分别启动
pnpm dev:server  # 启动后端 (http://localhost:3001)
pnpm dev:web     # 启动前端 (http://localhost:3000)
```

### 5. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001/api
- API 文档: http://localhost:3001/api/docs

## ✨ 功能特性

### 🤖 AI 对话
- 支持多轮对话
- 流式响应（SSE）
- 对话历史记录
- Markdown 渲染

### 🎯 AI 助手定制
- 创建个性化 AI 助手
- 自定义系统提示词
- 配置模型参数（温度、Token等）
- 设置默认助手

### 📝 Prompt 库
- 创建和管理 Prompt 模板
- 公开/私有 Prompt
- 分类和标签
- 搜索和使用统计

### 👤 用户系统
- 邮箱注册/登录
- JWT 认证
- 个人资料管理

### 🎨 界面特性
- 响应式设计
- 深色/浅色主题
- 流畅动画效果
- 现代化 UI

## 📚 API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 用户
- `GET /api/user/profile` - 获取用户信息
- `PATCH /api/user/profile` - 更新用户信息

### 对话
- `GET /api/chat/conversations` - 获取对话列表
- `POST /api/chat/conversations` - 创建新对话
- `GET /api/chat/conversations/:id` - 获取对话详情
- `POST /api/chat/conversations/:id/messages` - 发送消息
- `DELETE /api/chat/conversations/:id` - 删除对话

### AI 助手
- `GET /api/assistants` - 获取助手列表
- `POST /api/assistants` - 创建助手
- `GET /api/assistants/:id` - 获取助手详情
- `PATCH /api/assistants/:id` - 更新助手
- `DELETE /api/assistants/:id` - 删除助手

### Prompt
- `GET /api/prompts/public` - 获取公开 Prompt
- `GET /api/prompts/my` - 获取我的 Prompt
- `POST /api/prompts` - 创建 Prompt
- `PATCH /api/prompts/:id` - 更新 Prompt
- `DELETE /api/prompts/:id` - 删除 Prompt

## 🔧 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 代码检查
pnpm lint

# 清理
pnpm clean

# Prisma 命令
pnpm --filter server prisma:generate  # 生成 Prisma 客户端
pnpm --filter server prisma:migrate   # 数据库迁移
pnpm --filter server prisma:studio    # 打开 Prisma Studio
```

## 📄 环境变量说明

### 后端 (.env)

| 变量名 | 说明 | 示例 |
|--------|------|------|
| PORT | 服务端口 | 3001 |
| DATABASE_URL | 数据库连接 | postgresql://... |
| JWT_SECRET | JWT 密钥 | your-secret-key |
| JWT_EXPIRES_IN | Token 过期时间 | 7d |
| OPENAI_API_KEY | OpenAI API Key | sk-... |
| OPENAI_BASE_URL | OpenAI API 地址 | https://api.openai.com/v1 |
| CORS_ORIGIN | 允许的前端地址 | http://localhost:3000 |

### 前端 (.env.local)

| 变量名 | 说明 | 示例 |
|--------|------|------|
| NEXT_PUBLIC_API_URL | 后端 API 地址 | http://localhost:3001/api |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📜 许可证

MIT License

