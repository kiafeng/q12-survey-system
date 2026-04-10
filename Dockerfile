FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY client/package*.json ./client/

# 安装依赖（包括 devDependencies）
RUN npm install && cd client && npm install

# 复制源代码
COPY . .

# 构建前端
RUN cd client && npm run build

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["node", "server/index.js"]
