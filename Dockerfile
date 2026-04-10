FROM node:18-alpine

# 强制重新构建时间戳: 2026-04-10-16-05
WORKDIR /app

# 先复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制 client package 文件
COPY client/package*.json ./client/

# 安装 client 依赖
WORKDIR /app/client
RUN npm install

# 复制源代码
COPY . .

# 清理旧的构建文件
RUN rm -rf dist

# 构建前端
WORKDIR /app/client
RUN npm run build

# 返回工作目录
WORKDIR /app

# 暴露端口
ENV PORT=3001
EXPOSE 3001

# 启动服务
CMD ["node", "server/index.js"]
