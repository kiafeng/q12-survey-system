# Q12调研系统 - 强制重新构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制所有源代码
COPY . .

# 安装所有依赖（根目录和 client）
RUN npm install && cd client && npm install

# 构建前端
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 从构建阶段复制前端文件
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/data ./data

# 安装生产依赖
RUN npm install --production

# 暴露端口
EXPOSE 8080

ENV PORT=8080

CMD ["node", "server/index.js"]
