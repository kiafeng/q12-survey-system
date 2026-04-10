FROM node:18-alpine

WORKDIR /app

# 强制重新构建
RUN echo "Rebuild at $(date)"

# 先复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制 client package 文件
COPY client/package*.json ./client/

# 安装 client 依赖
WORKDIR /app/client
RUN npm install

# 复制源代码（覆盖旧文件）
COPY client/src ./src
COPY client/public ./public
COPY client/index.html ./
COPY client/vite.config.js ./

# 构建前端
RUN npm run build

# 返回工作目录
WORKDIR /app

# 复制服务端代码
COPY server ./server

# 暴露端口
ENV PORT=3001
EXPOSE 3001

# 启动服务
CMD ["node", "server/index.js"]
