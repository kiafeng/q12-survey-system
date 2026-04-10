# Windows 部署指南

## 方式一：直接运行（推荐用于测试）

### 1. 安装依赖
```powershell
cd Q12SurveySystem
npm run setup
```

### 2. 生成示例数据（可选）
```powershell
node server/generate-sample.js
```

### 3. 启动服务
```powershell
npm run dev
```

服务启动后：
- 前台页面: http://localhost:3000/admin
- 问卷地址: http://localhost:3000/survey/{token}

---

## 方式二：使用PM2生产环境部署

### 1. 安装PM2
```powershell
npm install -g pm2
```

### 2. 构建前端
```powershell
npm run build
```

### 3. 启动服务
```powershell
npm start
```

### 4. 配置PM2开机自启
```powershell
pm2 startup
pm2 save
```

---

## 方式三：Docker部署

### 1. 创建Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

### 2. 构建和运行
```powershell
docker build -t q12-survey .
docker run -d -p 3001:3001 --name q12-survey q12-survey
```

---

## 数据存储

数据文件位置: `data/q12survey.json`

**重要**: 请定期备份此文件！

---

## 功能使用说明

### 1. 创建部门
1. 登录后台 → 部门管理 → 添加部门
2. 填写部门名称、编码、选择层级
3. 系统自动生成该部门的问卷链接

### 2. 分配权限
1. 登录后台 → 用户管理 → 添加用户
2. 选择"事业部管理员"角色
3. 关联对应的部门

### 3. 分发问卷
1. 在部门列表中找到对应部门的问卷链接
2. 点击"复制"按钮获取链接
3. 通过邮件/企业微信等方式分发给员工

### 4. 查看分析
1. 登录后台 → 数据看板
2. 查看整体得分和各部门排名
3. 进入AI分析报告获取详细解读

---

## 常见问题

### Q: 如何修改管理员密码？
A: 登录后台 → 用户管理 → 点击用户右侧"重置密码"

### Q: 如何导出数据？
A: 登录后台 → AI分析报告 → 点击"导出数据"按钮

### Q: 问卷链接失效了怎么办？
A: 部门管理 → 点击对应部门的"编辑" → 重新启用，或使用"重新生成链接"功能
