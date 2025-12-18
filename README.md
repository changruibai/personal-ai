# Personal AI - 个性化 AI 对话应用

<div align="center">

一套功能完善的前后端分离 AI 应用，支持智能对话、助手定制、图片生成、简历优化等多种 AI 能力。

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-8+-orange.svg)](https://pnpm.io/)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [API 文档](#-api-接口) • [部署指南](#-docker-部署) • [贡献指南](#-贡献指南)

</div>

---

## 📸 应用预览

> 注：此处可添加应用截图展示主要功能界面

## 📋 目录

- [技术栈](#-技术栈)
- [架构亮点](#-架构亮点)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [功能特性](#-功能特性)
- [API 接口](#-api-接口)
- [开发命令](#-开发命令)
- [环境变量说明](#-环境变量说明)
- [Docker 部署](#-docker-部署)
- [生产部署](#-生产部署)
- [常见问题](#-常见问题)
- [路线图](#-路线图)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

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

## 🌟 架构亮点

### 性能优化
- **前端**：React 18 并发渲染、组件懒加载、图片优化
- **后端**：数据库连接池、查询优化、缓存策略
- **网络**：SSE 流式传输、请求去重与节流

### 安全措施
- JWT Token 认证与刷新机制
- 请求参数验证（class-validator）
- SQL 注入防护（Prisma ORM）
- XSS 防护（内容转义）
- CORS 跨域控制
- 敏感信息加密存储

### 可扩展性
- Monorepo 架构，易于添加新应用
- 模块化设计，功能解耦
- 统一的错误处理和日志系统
- RESTful API 设计规范
- 完善的 TypeScript 类型定义

### 开发体验
- 热重载开发环境
- ESLint + Prettier 代码规范
- Git Hooks 提交前检查
- Swagger API 文档自动生成
- Prisma Studio 数据库可视化

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
│   │       │   ├── prompt/     # Prompt模块
│   │       │   ├── image/      # 图片生成模块
│   │       │   ├── resume/     # 简历优化模块
│   │       │   └── health/     # 健康检查模块
│   │       └── prisma/  # Prisma 服务
│   │
│   └── web/             # Next.js 前端应用
│       └── src/
│           ├── app/     # 页面路由
│           │   ├── (auth)/       # 认证页面
│           │   └── (main)/       # 主应用页面
│           │       ├── chat/     # 对话页面
│           │       ├── assistants/ # 助手管理
│           │       ├── market/   # 助手市场
│           │       ├── prompts/  # Prompt库
│           │       ├── resume/   # 简历优化
│           │       └── settings/ # 设置页面
│           ├── components/  # 组件
│           │   ├── assistant/  # 助手组件
│           │   ├── chat/       # 对话组件
│           │   ├── image/      # 图片组件
│           │   ├── resume/     # 简历组件
│           │   ├── layout/     # 布局组件
│           │   └── ui/         # UI基础组件
│           ├── lib/     # 工具函数
│           ├── store/   # 状态管理
│           └── hooks/   # 自定义Hooks
│
├── packages/            # 共享包（可扩展）
├── .github/workflows/   # GitHub Actions
├── docker-compose.yml   # Docker 编排配置
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
- Markdown 渲染与代码高亮
- 智能相关问题推荐
- 复制消息内容

### 🎯 AI 助手定制
- 创建个性化 AI 助手
- 自定义系统提示词
- 配置模型参数（温度、Token、Top P等）
- 设置默认助手
- 支持图片输入配置
- 相关问题推荐开关

### 🏪 助手市场
- 浏览公开的 AI 助手
- 一键导入优质助手
- 助手分享与协作
- 助手评价和使用统计

### 📝 Prompt 库
- 创建和管理 Prompt 模板
- 公开/私有 Prompt
- 分类和标签
- 搜索和使用统计
- 快速应用到对话

### 🖼️ AI 图片生成
- 集成多个图片生成服务（Replicate、Hugging Face）
- 支持多种风格和尺寸
- 生成历史记录
- 一键保存和分享

### 📄 AI 简历优化
- 智能简历诊断与评分
- 多维度优化建议（内容、格式、关键词等）
- 内置专业简历模板
- 实时预览优化效果
- 支持导出为 PDF/Word

### 👤 用户系统
- 邮箱注册/登录
- JWT 认证
- 个人资料管理
- 头像上传
- 偏好设置

### 🎨 界面特性
- 响应式设计，支持移动端
- 深色/浅色主题切换
- 流畅的过渡动画效果
- 现代化 UI 设计
- 直观的交互体验

## 📚 API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取当前用户信息

### 用户
- `GET /api/user/profile` - 获取用户资料
- `PATCH /api/user/profile` - 更新用户资料
- `POST /api/user/avatar` - 上传头像

### 对话
- `GET /api/chat/conversations` - 获取对话列表
- `POST /api/chat/conversations` - 创建新对话
- `GET /api/chat/conversations/:id` - 获取对话详情
- `GET /api/chat/conversations/:id/messages` - 获取对话消息
- `POST /api/chat/conversations/:id/messages` - 发送消息
- `DELETE /api/chat/conversations/:id` - 删除对话
- `PATCH /api/chat/conversations/:id` - 更新对话信息

### AI 助手
- `GET /api/assistants` - 获取助手列表
- `POST /api/assistants` - 创建助手
- `GET /api/assistants/:id` - 获取助手详情
- `PATCH /api/assistants/:id` - 更新助手
- `DELETE /api/assistants/:id` - 删除助手
- `GET /api/assistants/market` - 获取市场助手列表
- `POST /api/assistants/:id/publish` - 发布助手到市场
- `POST /api/assistants/:id/import` - 从市场导入助手

### Prompt
- `GET /api/prompts/public` - 获取公开 Prompt
- `GET /api/prompts/my` - 获取我的 Prompt
- `POST /api/prompts` - 创建 Prompt
- `GET /api/prompts/:id` - 获取 Prompt 详情
- `PATCH /api/prompts/:id` - 更新 Prompt
- `DELETE /api/prompts/:id` - 删除 Prompt
- `POST /api/prompts/:id/use` - 增加使用次数

### 图片生成
- `POST /api/image/generate` - 生成图片
- `GET /api/image/history` - 获取生成历史
- `GET /api/image/models` - 获取可用模型列表

### 简历优化
- `POST /api/resume/diagnose` - 诊断简历
- `POST /api/resume/optimize` - 优化简历
- `GET /api/resume/templates` - 获取简历模板列表
- `POST /api/resume/render` - 渲染简历模板

### 健康检查
- `GET /api/health` - 服务健康状态
- `GET /api/health/db` - 数据库连接状态

## 🔧 开发命令

### 基础命令

```bash
# 安装依赖
pnpm install

# 开发模式（并行启动前后端）
pnpm dev

# 分别启动前后端
pnpm dev:web      # 启动前端 (http://localhost:3000)
pnpm dev:server   # 启动后端 (http://localhost:3001)

# 构建所有应用
pnpm build

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 格式检查
pnpm format:check

# 清理所有 node_modules 和构建文件
pnpm clean
```

### Prisma 数据库命令

```bash
# 生成 Prisma 客户端
pnpm --filter server prisma:generate

# 创建数据库迁移
pnpm --filter server prisma:migrate

# 重置数据库
pnpm --filter server prisma:reset

# 打开 Prisma Studio（数据库可视化工具）
pnpm --filter server prisma:studio

# 查看数据库状态
pnpm --filter server prisma:status
```

### 单独操作某个应用

```bash
# 在 server 应用中安装依赖
pnpm --filter server add [package-name]

# 在 web 应用中安装依赖
pnpm --filter web add [package-name]

# 在 server 应用中运行命令
pnpm --filter server [command]
```

## 📄 环境变量说明

### 后端 (.env)

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| PORT | 服务端口 | 3001 | ✅ |
| DATABASE_URL | 数据库连接 | postgresql://user:pass@localhost:5432/db | ✅ |
| JWT_SECRET | JWT 密钥 | your-secret-key | ✅ |
| JWT_EXPIRES_IN | Token 过期时间 | 7d | ✅ |
| OPENAI_API_KEY | OpenAI API Key | sk-... | ✅ |
| OPENAI_BASE_URL | OpenAI API 地址 | https://api.openai.com/v1 | ❌ |
| CORS_ORIGIN | 允许的前端地址 | http://localhost:3000 | ✅ |
| REPLICATE_API_TOKEN | Replicate API Token | r8_... | ❌ |
| HUGGINGFACE_API_KEY | Hugging Face API Key | hf_... | ❌ |

### 前端 (.env.local)

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| NEXT_PUBLIC_API_URL | 后端 API 地址 | http://localhost:3001/api | ✅ |

## 📊 性能优化建议

### 前端优化
- 使用 Next.js Image 组件优化图片加载
- 启用 React.memo 减少不必要的重渲染
- 使用动态导入（Dynamic Import）进行代码分割
- 配置合适的缓存策略（SWR）

### 后端优化
- 数据库查询使用索引
- 实现请求缓存（Redis）
- 使用连接池管理数据库连接
- API 响应分页处理

### 生产环境建议
- 配置 CDN 加速静态资源
- 启用 Gzip/Brotli 压缩
- 设置合理的 CORS 策略
- 配置日志收集和监控
- 定期备份数据库

## 🔒 安全最佳实践

1. **环境变量管理**
   - 不要将 `.env` 文件提交到版本控制
   - 生产环境使用强密码和复杂的 JWT Secret
   - 定期轮换 API Keys

2. **API 安全**
   - 实现请求频率限制（Rate Limiting）
   - 验证所有用户输入
   - 使用 HTTPS 加密传输
   - 实现适当的 CORS 策略

3. **数据安全**
   - 敏感数据加密存储
   - 定期备份数据库
   - 实现数据访问权限控制
   - 记录关键操作日志

## 🐳 Docker 部署

项目支持使用 Docker 和 Docker Compose 进行快速部署。

### 使用 Docker Compose 一键部署

```bash
# 复制环境变量配置
cp apps/server/env.example apps/server/.env

# 编辑环境变量
vim apps/server/.env

# 启动所有服务（包括数据库）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

docker-compose.yml 包含以下服务：
- **web**: Next.js 前端应用
- **server**: NestJS 后端服务
- **postgres**: PostgreSQL 数据库

### 单独构建镜像

**后端镜像：**
```bash
cd apps/server
docker build -t personal-ai-server .
docker run -p 3001:3001 --env-file .env personal-ai-server
```

**前端镜像：**
```bash
cd apps/web
docker build -t personal-ai-web .
docker run -p 3000:3000 personal-ai-web
```

## 🚀 生产部署

### Railway 部署

项目已配置 Railway 部署文件 (`railway.json`)，可以一键部署到 Railway。

1. Fork 本项目
2. 在 [Railway](https://railway.app/) 创建新项目
3. 连接 GitHub 仓库
4. 配置环境变量
5. 自动部署

### Vercel 部署（前端）

前端应用可以单独部署到 Vercel：

```bash
cd apps/web
vercel
```

### 传统服务器部署

```bash
# 1. 安装依赖
pnpm install

# 2. 构建应用
pnpm build

# 3. 启动生产服务
# 后端
cd apps/server
pnpm start:prod

# 前端
cd apps/web
pnpm start
```

建议使用 PM2 进行进程管理：

```bash
pm2 start apps/server/dist/main.js --name personal-ai-server
pm2 start apps/web --name personal-ai-web -- start
```

## ❓ 常见问题

### Q: 如何更换 AI 模型？

A: 在创建或编辑 AI 助手时，可以在"模型"字段选择不同的模型（如 gpt-4、gpt-3.5-turbo 等）。

### Q: 支持哪些图片生成模型？

A: 目前支持 Replicate 和 Hugging Face 平台的多种模型，包括 Stable Diffusion、DALL-E 等。需要配置相应的 API Key。

### Q: 数据库迁移失败怎么办？

A: 确保 PostgreSQL 服务正常运行，检查 DATABASE_URL 配置是否正确。可以尝试重置数据库：
```bash
cd apps/server
pnpm prisma:reset
pnpm prisma:migrate
```

### Q: 如何使用自己的 OpenAI API 代理？

A: 在后端 `.env` 文件中设置 `OPENAI_BASE_URL` 为你的代理地址。

### Q: 前后端如何联调？

A: 确保后端运行在 3001 端口，前端 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 配置为 `http://localhost:3001/api`。

### Q: 如何自定义主题颜色？

A: 修改 `apps/web/src/app/globals.css` 中的 CSS 变量，或使用 Tailwind CSS 配置文件自定义颜色方案。

## 🗺️ 路线图

- [x] 基础 AI 对话功能
- [x] 用户认证系统
- [x] AI 助手定制
- [x] Prompt 库管理
- [x] 图片生成功能
- [x] 简历优化功能
- [x] 助手市场
- [ ] 多模态对话（语音输入/输出）
- [ ] 知识库集成（RAG）
- [ ] 插件系统
- [ ] 团队协作功能
- [ ] 移动端 App
- [ ] AI 工作流编排
- [ ] 数据分析面板
- [ ] 国际化支持（i18n）

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 提交 Issue
- 使用清晰的标题描述问题
- 提供复现步骤
- 附上相关的错误日志和截图

### 提交 Pull Request
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 遵循项目的 ESLint 和 Prettier 配置
- 编写清晰的注释
- 保持代码简洁和可维护性
- 添加必要的单元测试

## 📧 联系方式

- 提交 Issue: [GitHub Issues](https://github.com/yourusername/personal-ai/issues)
- 项目讨论: [GitHub Discussions](https://github.com/yourusername/personal-ai/discussions)

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [NestJS](https://nestjs.com/) - Node.js 框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [OpenAI](https://openai.com/) - AI 能力支持

## 📜 许可证

MIT License

Copyright (c) 2024 Personal AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

