FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY client/package*.json ./client/
COPY client/vite.config.js ./client/

# 安装根目录依赖
RUN npm install

# 安装 client 依赖（包含 vite）
WORKDIR /app/client
RUN npm install

# 返回工作目录
WORKDIR /app

# 复制源代码
COPY . .

# 构建前端
WORKDIR /app/client
RUN npm run build

# 返回工作目录
WORKDIR /app

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["node", "server/index.js"]
