# 前端 Dockerfile
FROM node:18-alpine AS base

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS build

# 复制源代码
COPY . .

WORKDIR /app/apps/web

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:18-alpine AS production

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

WORKDIR /app

# 复制构建产物和必要文件
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/apps/web/next.config.js ./next.config.js
COPY --from=build /app/apps/web/tsconfig.json ./tsconfig.json
COPY --from=build /app/node_modules ./node_modules

# 暴露端口
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["pnpm", "start"]

