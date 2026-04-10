# Q12调研系统 - 强制重新构建 2026-04-10-17-45
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm install --production

# 复制 server 代码
COPY server ./server
COPY data ./data

# 复制前端构建文件
COPY client/dist ./client/dist

# 暴露端口
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server/index.js"]
