FROM node:18-alpine

WORKDIR /app

# 复制所有文件
COPY . .

# 安装依赖
RUN npm install

# 安装 client 依赖
WORKDIR /app/client
RUN npm install

# 构建前端
WORKDIR /app/client
RUN npm run build

# 返回工作目录
WORKDIR /app

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["npm", "start"]
