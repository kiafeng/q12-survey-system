# Q12调研系统 - 简化版
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖（不含 devDependencies）
RUN npm install --production

# 复制 server 代码
COPY server ./server
COPY data ./data

# 复制已构建的前端（由 GitHub Actions 或本地构建）
COPY client/dist ./client/dist

# 暴露端口
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server/index.js"]
