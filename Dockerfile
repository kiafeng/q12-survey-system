# Q12调研系统 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件并安装依赖
COPY package*.json ./
RUN npm install

# 复制 client 包文件并安装前端依赖
COPY client/package*.json ./client/
RUN cd client && npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 8080

# 启动命令
ENV PORT=8080
CMD ["npm", "start"]
