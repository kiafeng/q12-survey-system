# Q12调研系统 - 腾讯云 CloudBase 部署
FROM node:18-alpine

WORKDIR /app

# 复制所有代码
COPY . .

# 安装根依赖（用于后端）
RUN npm install --production

# 安装前端依赖并构建
RUN cd client && npm install && npm run build

# 暴露端口
EXPOSE 3001
ENV PORT=3001

CMD ["node", "server/index.js"]
