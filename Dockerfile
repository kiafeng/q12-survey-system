# Q12调研系统
FROM node:18-alpine

WORKDIR /app

# 复制并安装根依赖
COPY package*.json ./
RUN npm install --production

# 复制并安装前端依赖
COPY client/package*.json ./client/
RUN cd client && npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server/index.js"]
