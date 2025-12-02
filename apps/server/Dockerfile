# 后端 Dockerfile
FROM node:18-alpine AS base

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS build

# 复制源代码
COPY . .

# 生成 Prisma Client
WORKDIR /app/apps/server
RUN pnpm prisma:generate

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:18-alpine AS production

# 安装 pnpm 和必要的工具
RUN npm install -g pnpm@8.15.0 && \
    apk add --no-cache openssl curl

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物和 Prisma
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/prisma ./apps/server/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/server

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# 启动应用
CMD ["node", "dist/main.js"]

