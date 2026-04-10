const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'q12survey.json');

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据存储
let store = {
  data: {
    departments: [],
    users: [],
    questionnaires: [], // 新增：问卷列表
    surveys: [],
    analysis_reports: []
  },
  load() {
    try {
      if (fs.existsSync(dbPath)) {
        this.data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        // 确保新字段存在
        if (!this.data.questionnaires) this.data.questionnaires = [];
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  },
  save() {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }
};

store.load();

// Q12问题定义
const Q12_QUESTIONS = [
  { id: 'q1', text: '我知道公司对我的工作要求', dimension: '基础要求' },
  { id: 'q2', text: '我有做好我的工作所需要的材料和设备', dimension: '工作资源' },
  { id: 'q3', text: '在工作中，我每天都有机会做我最擅长的事', dimension: '发挥优势' },
  { id: 'q4', text: '在过去的七天里，我因工作出色而受到表扬', dimension: '认可表扬' },
  { id: 'q5', text: '我觉得我的主管或同事关心我的个人情况', dimension: '关爱员工' },
  { id: 'q6', text: '工作单位有人鼓励我的发展', dimension: '成长发展' },
  { id: 'q7', text: '在工作中，我觉得我的意见受到重视', dimension: '尊重意见' },
  { id: 'q8', text: '公司的使命/目标使我觉得我的工作重要', dimension: '使命价值' },
  { id: 'q9', text: '我的同事们致力于高质量的工作', dimension: '同事质量' },
  { id: 'q10', text: '我在工作单位有一个最要好的朋友', dimension: '人际关系' },
  { id: 'q11', text: '在过去的六个月内，有人和我谈及我的进步', dimension: '进步反馈' },
  { id: 'q12', text: '过去一年里，我有机会学习成长', dimension: '学习成长' }
];

const DIMENSIONS = {
  '基础要求': ['q1'], '工作资源': ['q2'], '发挥优势': ['q3'], '认可表扬': ['q4'],
  '关爱员工': ['q5'], '成长发展': ['q6'], '尊重意见': ['q7'], '使命价值': ['q8'],
  '同事质量': ['q9'], '人际关系': ['q10'], '进步反馈': ['q11'], '学习成长': ['q12']
};

const generateSurveyToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// 创建默认管理员
if (!store.data.users.find(u => u.username === 'admin')) {
  const passwordHash = bcrypt.hashSync('admin123', 10);
  store.data.users.push({
    id: uuidv4(), username: 'admin', password_hash: passwordHash,
    real_name: '系统管理员', role: 1, department_id: null, status: 1,
    created_at: new Date().toISOString()
  });
  store.save();
  console.log('默认管理员已创建: admin / admin123');
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'q12-survey-secret-key-2024';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 静态文件 - 已构建的前端
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// 认证中间件
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

// ============ 公开API ============
// 验证问卷链接
app.get('/api/public/validate-token/:token', (req, res) => {
  // status=2 表示正在收集中，只有收集中状态的问卷才能被填写
  const questionnaire = store.data.questionnaires.find(q => q.token === req.params.token && q.status === 2);
  if (!questionnaire) return res.status(404).json({ error: '问卷链接无效或已关闭' });

  const dept = store.data.departments.find(d => d.id === questionnaire.department_id);
  const parent = dept ? store.data.departments.find(p => p.id === dept.parent_id) : null;

  res.json({
    success: true,
    questionnaire: {
      id: questionnaire.id,
      title: questionnaire.title,
      departmentName: dept?.name || '',
      parentName: parent?.name || null
    }
  });
});

app.get('/api/public/questions', (req, res) => {
  res.json({ success: true, questions: Q12_QUESTIONS });
});

// 检查设备是否已提交（用于加载时提示）
app.post('/api/public/check-submitted', (req, res) => {
  const { token, deviceId } = req.body;
  
  // 如果没有设备ID，直接返回未提交
  if (!deviceId) {
    return res.json({ submitted: false });
  }
  
  // 查找该问卷
  const questionnaire = store.data.questionnaires.find(q => q.token === token);
  if (!questionnaire) {
    return res.json({ submitted: false });
  }
  
  // 检查设备ID是否已提交过
  const existing = store.data.surveys.find(
    s => s.questionnaire_id === questionnaire.id && s.device_id === deviceId
  );
  
  res.json({ submitted: !!existing });
});

app.post('/api/public/submit-survey', (req, res) => {
  const { token, answers, deviceId } = req.body;
  // status=2 表示正在收集中
  const questionnaire = store.data.questionnaires.find(q => q.token === token && q.status === 2);
  if (!questionnaire) return res.status(404).json({ error: '问卷链接无效' });

  // 检查是否已提交（优先使用设备指纹，其次使用IP）
  if (deviceId) {
    const existingByDevice = store.data.surveys.find(
      s => s.questionnaire_id === questionnaire.id && s.device_id === deviceId
    );
    if (existingByDevice) {
      return res.status(400).json({ error: '您已提交过此问卷，感谢您的参与！' });
    }
  }
  
  const ipHash = crypto.createHash('md5').update(req.ip || req.connection.remoteAddress).digest('hex');
  const existingByIp = store.data.surveys.find(
    s => s.questionnaire_id === questionnaire.id && s.ip_hash === ipHash
  );
  if (existingByIp) {
    return res.status(400).json({ error: '您已提交过此问卷，感谢您的参与！' });
  }

  store.data.surveys.push({
    id: uuidv4(),
    questionnaire_id: questionnaire.id,
    department_id: questionnaire.department_id,
    answers: JSON.stringify(answers),
    ip_hash: ipHash,
    device_id: deviceId || null,  // 保存设备指纹
    submitted_at: new Date().toISOString()
  });
  store.save();
  res.json({ success: true, message: '问卷提交成功，感谢您的参与！' });
});

// ============ 管理员登录 ============
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = store.data.users.find(u => u.username === username && u.status === 1);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, departmentId: user.department_id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, username: user.username, realName: user.real_name, role: user.role, departmentId: user.department_id } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = store.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ success: true, user: { id: user.id, username: user.username, realName: user.real_name, role: user.role, departmentId: user.department_id } });
});

// ============ 部门管理 ============
app.get('/api/departments', authMiddleware, (req, res) => {
  let departments = store.data.departments.map(d => {
    const parent = store.data.departments.find(p => p.id === d.parent_id);
    const manager = store.data.users.find(u => u.id === d.manager_id);
    const surveyCount = store.data.surveys.filter(s => s.department_id === d.id).length;
    return { ...d, parent_name: parent?.name || null, manager_name: manager?.real_name || null, survey_count: surveyCount };
  });
  if (req.user.role === 2 && req.user.departmentId) {
    departments = departments.filter(d => d.id === req.user.departmentId || d.parent_id === req.user.departmentId);
  }
  departments.sort((a, b) => (a.level || 1) - (b.level || 1) || a.name.localeCompare(b.name));
  res.json({ success: true, departments });
});

app.post('/api/departments', authMiddleware, (req, res) => {
  if (req.user.role !== 1) return res.status(403).json({ error: '权限不足' });
  const { name, code, parentId, level = 1, managerId } = req.body;
  if (!name || !code) return res.status(400).json({ error: '部门名称和编码不能为空' });
  if (store.data.departments.find(d => d.code === code)) return res.status(400).json({ error: '部门编码已存在' });

  const department = {
    id: uuidv4(), name, code, parent_id: parentId || null, level,
    manager_id: managerId || null, status: 1, created_at: new Date().toISOString()
  };
  store.data.departments.push(department);
  store.save();
  res.json({ success: true, department });
});

app.put('/api/departments/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 1) return res.status(403).json({ error: '权限不足' });
  const idx = store.data.departments.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '部门不存在' });
  const dept = store.data.departments[idx];
  const { name, code, parentId, level, managerId, status } = req.body;
  store.data.departments[idx] = {
    ...dept, name: name ?? dept.name, code: code ?? dept.code,
    parent_id: parentId !== undefined ? parentId : dept.parent_id,
    level: level ?? dept.level, manager_id: managerId !== undefined ? managerId : dept.manager_id,
    status: status !== undefined ? status : dept.status
  };
  store.save();
  res.json({ success: true, department: store.data.departments[idx] });
});

app.delete('/api/departments/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 1) return res.status(403).json({ error: '权限不足' });
  const dept = store.data.departments.find(d => d.id === req.params.id);
  if (!dept) return res.status(404).json({ error: '部门不存在' });
  if (store.data.departments.filter(d => d.parent_id === req.params.id).length > 0) return res.status(400).json({ error: '请先删除子部门' });
  // 检查是否有问卷关联
  if (store.data.questionnaires.filter(q => q.department_id === req.params.id).length > 0) {
    return res.status(400).json({ error: '该部门已有问卷，无法删除' });
  }
  store.data.departments = store.data.departments.filter(d => d.id !== req.params.id);
  store.save();
  res.json({ success: true, message: '删除成功' });
});

// ============ 问卷管理 ============
// 获取问卷列表
app.get('/api/questionnaires', authMiddleware, (req, res) => {
  let questionnaires = store.data.questionnaires.map(q => {
    const dept = store.data.departments.find(d => d.id === q.department_id);
    const surveyCount = store.data.surveys.filter(s => s.questionnaire_id === q.id).length;
    return { ...q, department_name: dept?.name || '', survey_count: surveyCount };
  });

  // 事业部管理员只能看到自己部门的问卷
  if (req.user.role === 2 && req.user.departmentId) {
    const childDepts = store.data.departments
      .filter(d => d.id === req.user.departmentId || d.parent_id === req.user.departmentId)
      .map(d => d.id);
    questionnaires = questionnaires.filter(q => childDepts.includes(q.department_id));
  }

  // 按创建时间倒序
  questionnaires.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ success: true, questionnaires });
});

// 创建问卷
app.post('/api/questionnaires', authMiddleware, (req, res) => {
  const { departmentId, title, startDate, endDate } = req.body;

  // 事业部管理员只能创建自己部门的问卷
  if (req.user.role === 2 && req.user.departmentId !== departmentId) {
    return res.status(403).json({ error: '权限不足' });
  }

  const dept = store.data.departments.find(d => d.id === departmentId);
  if (!dept) return res.status(404).json({ error: '部门不存在' });

  const questionnaire = {
    id: uuidv4(),
    department_id: departmentId,
    title: title || `${dept.name} Q12调研`,
    token: generateSurveyToken(),
    start_date: startDate || null,
    end_date: endDate || null,
    status: 1, // 1=草稿, 2=收集中, 3=已结束
    created_by: req.user.id,
    created_at: new Date().toISOString()
  };

  store.data.questionnaires.push(questionnaire);
  store.save();
  res.json({ success: true, questionnaire });
});

// 更新问卷
app.put('/api/questionnaires/:id', authMiddleware, (req, res) => {
  const idx = store.data.questionnaires.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '问卷不存在' });

  const q = store.data.questionnaires[idx];

  // 事业部管理员只能修改自己部门的问卷
  if (req.user.role === 2 && req.user.departmentId !== q.department_id) {
    return res.status(403).json({ error: '权限不足' });
  }

  const { title, startDate, endDate, status } = req.body;
  store.data.questionnaires[idx] = {
    ...q,
    title: title ?? q.title,
    start_date: startDate !== undefined ? startDate : q.start_date,
    end_date: endDate !== undefined ? endDate : q.end_date,
    status: status !== undefined ? status : q.status
  };
  store.save();
  res.json({ success: true, questionnaire: store.data.questionnaires[idx] });
});

// 删除问卷（只能删除草稿状态的问卷）
app.delete('/api/questionnaires/:id', authMiddleware, (req, res) => {
  const q = store.data.questionnaires.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: '问卷不存在' });

  if (req.user.role === 2 && req.user.departmentId !== q.department_id) {
    return res.status(403).json({ error: '权限不足' });
  }

  if (q.status === 2) {
    return res.status(400).json({ error: '收集中状态的问卷无法删除' });
  }

  store.data.questionnaires = store.data.questionnaires.filter(q => q.id !== req.params.id);
  store.data.surveys = store.data.surveys.filter(s => s.questionnaire_id !== req.params.id);
  store.save();
  res.json({ success: true, message: '删除成功' });
});

// 重置问卷链接
app.post('/api/questionnaires/:id/regenerate-token', authMiddleware, (req, res) => {
  const idx = store.data.questionnaires.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '问卷不存在' });

  const q = store.data.questionnaires[idx];
  if (req.user.role === 2 && req.user.departmentId !== q.department_id) {
    return res.status(403).json({ error: '权限不足' });
  }

  store.data.questionnaires[idx].token = generateSurveyToken();
  store.save();
  res.json({ success: true, token: store.data.questionnaires[idx].token, url: `${req.protocol}://${req.get('host')}/survey/${store.data.questionnaires[idx].token}` });
});

// ============ 用户管理 ============
app.get('/api/users', authMiddleware, (req, res) => {
  if (req.user.role !== 1) return res.status(403).json({ error: '权限不足' });
  const users = store.data.users.map(u => {
    const dept = store.data.departments.find(d => d.id === u.department_id);
    return { ...u, department_name: dept?.name || null };
  });
  res.json({ success: true, users });
});

app.post('/api/users', authMiddleware, (req, res) => {
  if (req.user.role !== 1) return res.status(403).json({ error: '权限不足' });
  const { username, password, realName, role = 2, departmentId } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (store.data.users.find(u => u.username === username)) return res.status(400).json({ error: '用户名已存在' });
  store.data.users.push({
    id: uuidv4(), username, password_hash: bcrypt.hashSync(password, 10),
    real_name: realName || username, role, department_id: departmentId || null,
    status: 1, created_at: new Date().toISOString()
  });
  store.save();
  res.json({ success: true, message: '用户创建成功' });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 1) return res.status(403).json({ error: '权限不足' });
  const idx = store.data.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '用户不存在' });
  const user = store.data.users[idx];
  const { realName, role, departmentId, status } = req.body;
  store.data.users[idx] = {
    ...user, real_name: realName ?? user.real_name, role: role ?? user.role,
    department_id: departmentId !== undefined ? departmentId : user.department_id,
    status: status !== undefined ? status : user.status
  };
  store.save();
  res.json({ success: true, message: '更新成功' });
});

app.post('/api/users/:id/reset-password', authMiddleware, (req, res) => {
  if (req.user.role !== 1) return res.status(403).json({ error: '权限不足' });
  const idx = store.data.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '用户不存在' });
  if (!req.body.newPassword) return res.status(400).json({ error: '请输入新密码' });
  store.data.users[idx].password_hash = bcrypt.hashSync(req.body.newPassword, 10);
  store.save();
  res.json({ success: true, message: '密码重置成功' });
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 1) return res.status(403).json({ error: '权限不足' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: '不能删除当前登录用户' });
  store.data.users = store.data.users.filter(u => u.id !== req.params.id);
  store.save();
  res.json({ success: true, message: '删除成功' });
});

// ============ 数据看板 ============
app.get('/api/stats/overview', authMiddleware, (req, res) => {
  const { questionnaireId } = req.query;
  let surveys = store.data.surveys;

  // 按问卷筛选
  if (questionnaireId) {
    surveys = surveys.filter(s => s.questionnaire_id === questionnaireId);
  } else if (req.user.role === 2 && req.user.departmentId) {
    const allowed = store.data.departments.filter(d => d.id === req.user.departmentId || d.parent_id === req.user.departmentId).map(d => d.id);
    surveys = surveys.filter(s => allowed.includes(s.department_id));
  }

  const q12Scores = {};
  Q12_QUESTIONS.forEach(q => q12Scores[q.id] = { text: q.text, dimension: q.dimension, scores: [] });
  surveys.forEach(survey => {
    const answers = JSON.parse(survey.answers);
    for (let i = 1; i <= 12; i++) q12Scores[`q${i}`].scores.push(parseInt(answers[`q${i}`]));
  });

  const avgScores = Q12_QUESTIONS.map(q => {
    const data = q12Scores[q.id];
    const avg = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
    return { id: q.id, question: q.text, dimension: q.dimension, avgScore: Math.round(avg * 100) / 100, count: data.scores.length };
  });

  const overallAvg = avgScores.reduce((a, b) => a + b.avgScore, 0) / avgScores.length;
  res.json({ success: true, stats: { totalSurveys: surveys.length, avgScore: Math.round(overallAvg * 100) / 100, q12Scores: avgScores } });
});

app.get('/api/stats/department-ranking', authMiddleware, (req, res) => {
  const { questionnaireId } = req.query;
  let departments = store.data.departments.filter(d => d.status === 1);

  if (req.user.role === 2 && req.user.departmentId) {
    departments = departments.filter(d => d.id === req.user.departmentId || d.parent_id === req.user.departmentId);
  }

  let surveys = store.data.surveys;
  if (questionnaireId) {
    surveys = surveys.filter(s => s.questionnaire_id === questionnaireId);
  }

  const rankings = departments.map(dept => {
    const deptSurveys = surveys.filter(s => s.department_id === dept.id);
    if (deptSurveys.length === 0) return { id: dept.id, name: dept.name, level: dept.level, survey_count: 0, avgScore: null };

    const qScores = {};
    Q12_QUESTIONS.forEach(q => qScores[q.id] = []);
    deptSurveys.forEach(survey => {
      const answers = JSON.parse(survey.answers);
      for (let i = 1; i <= 12; i++) qScores[`q${i}`].push(parseInt(answers[`q${i}`]));
    });

    const avgScores = Q12_QUESTIONS.map(q => {
      const scores = qScores[q.id];
      return scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
    });
    const overallAvg = avgScores.reduce((a, b) => a + b, 0) / avgScores.length;
    return { id: dept.id, name: dept.name, level: dept.level, survey_count: deptSurveys.length, avgScore: Math.round(overallAvg * 100) / 100 };
  });

  res.json({ success: true, rankings });
});

app.get('/api/stats/dimensions', authMiddleware, (req, res) => {
  const { questionnaireId } = req.query;
  let surveys = store.data.surveys;

  if (questionnaireId) {
    surveys = surveys.filter(s => s.questionnaire_id === questionnaireId);
  } else if (req.user.role === 2 && req.user.departmentId) {
    const allowed = store.data.departments.filter(d => d.id === req.user.departmentId || d.parent_id === req.user.departmentId).map(d => d.id);
    surveys = surveys.filter(s => allowed.includes(s.department_id));
  }

  const dimensionScores = {};
  Object.keys(DIMENSIONS).forEach(dim => dimensionScores[dim] = []);
  surveys.forEach(survey => {
    const answers = JSON.parse(survey.answers);
    Object.entries(DIMENSIONS).forEach(([dim, questions]) => {
      const dimScores = questions.map(q => parseInt(answers[q]));
      dimensionScores[dim].push(dimScores.reduce((a, b) => a + b, 0) / dimScores.length);
    });
  });

  const result = Object.entries(dimensionScores).map(([dimension, scores]) => {
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { dimension, avgScore: Math.round(avg * 100) / 100, status: avg >= 8 ? 'excellent' : avg >= 7 ? 'good' : avg >= 6 ? 'warning' : 'danger' };
  });
  res.json({ success: true, dimensions: result });
});

app.get('/api/stats/ai-analysis', authMiddleware, (req, res) => {
  const { questionnaireId, departmentId } = req.query;
  let surveys = store.data.surveys;

  if (questionnaireId) {
    surveys = surveys.filter(s => s.questionnaire_id === questionnaireId);
  } else if (departmentId) {
    surveys = surveys.filter(s => s.department_id === departmentId);
  } else if (req.user.role === 2 && req.user.departmentId) {
    const allowed = store.data.departments.filter(d => d.id === req.user.departmentId || d.parent_id === req.user.departmentId).map(d => d.id);
    surveys = surveys.filter(s => allowed.includes(s.department_id));
  }

  if (surveys.length === 0) return res.json({ success: true, analysis: { summary: '暂无问卷数据', strengths: [], improvements: [], suggestions: [] } });

  const q12Scores = {};
  Q12_QUESTIONS.forEach(q => q12Scores[q.id] = []);
  surveys.forEach(survey => {
    const answers = JSON.parse(survey.answers);
    for (let i = 1; i <= 12; i++) q12Scores[`q${i}`].push(parseInt(answers[`q${i}`]));
  });

  const avgScores = Q12_QUESTIONS.map(q => {
    const scores = q12Scores[q.id];
    return { id: q.id, text: q.text, dimension: q.dimension, avgScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0 };
  });

  const overallAvg = avgScores.reduce((a, b) => a + b.avgScore, 0) / avgScores.length;
  const strengths = avgScores.filter(s => s.avgScore >= 8).sort((a, b) => b.avgScore - a.avgScore);
  const improvements = avgScores.filter(s => s.avgScore < 7).sort((a, b) => a.avgScore - b.avgScore);

  const dimensionAnalysis = {};
  Object.entries(DIMENSIONS).forEach(([dim, questions]) => {
    const dimScores = avgScores.filter(s => questions.includes(s.id));
    const avg = dimScores.reduce((a, b) => a + b.avgScore, 0) / dimScores.length;
    dimensionAnalysis[dim] = { avg: Math.round(avg * 100) / 100, status: avg >= 8 ? 'excellent' : avg >= 7 ? 'good' : avg >= 6 ? 'warning' : 'danger' };
  });

  const suggestions = [];
  Object.entries(dimensionAnalysis).forEach(([dim, data]) => {
    if (data.status === 'danger') suggestions.push({ priority: 'high', dimension: dim, suggestion: `【高优先级】${dim}维度得分较低（${data.avg}分），建议作为首要改善方向。` });
    else if (data.status === 'warning') suggestions.push({ priority: 'medium', dimension: dim, suggestion: `【中优先级】${dim}维度有一定提升空间（${data.avg}分）。` });
  });

  res.json({
    success: true,
    analysis: {
      summary: `本次调研共收集${surveys.length}份有效问卷，整体Q12综合得分为${overallAvg.toFixed(2)}分。${overallAvg >= 8 ? '表现优秀' : overallAvg >= 7 ? '处于良好水平' : overallAvg >= 6 ? '存在提升空间' : '需要重点关注'}`,
      totalScore: Math.round(overallAvg * 100) / 100,
      sampleSize: surveys.length,
      dimensionAnalysis,
      strengths: strengths.slice(0, 3).map(s => ({ dimension: s.dimension, score: s.avgScore, insight: `该维度表现优秀，得分${s.avgScore}分。` })),
      improvements: improvements.slice(0, 3).map(s => ({ dimension: s.dimension, score: s.avgScore, insight: `该维度需要改进，得分${s.avgScore}分。` })),
      suggestions,
      generatedAt: new Date().toISOString()
    }
  });
});

// 数据导出
app.get('/api/export/excel', authMiddleware, (req, res) => {
  const { questionnaireId, departmentId } = req.query;
  let surveys = store.data.surveys;

  // 支持多选问卷ID（逗号分隔）
  if (questionnaireId) {
    const ids = questionnaireId.split(',');
    surveys = surveys.filter(s => ids.includes(s.questionnaire_id));
  } else if (departmentId) {
    surveys = surveys.filter(s => s.department_id === departmentId);
  } else if (req.user.role === 2 && req.user.departmentId) {
    const allowed = store.data.departments.filter(d => d.id === req.user.departmentId || d.parent_id === req.user.departmentId).map(d => d.id);
    surveys = surveys.filter(s => allowed.includes(s.department_id));
  }

  const questionnaireIds = questionnaireId ? questionnaireId.split(',') : [];
  const questionnaire = questionnaireIds.length === 1 ? store.data.questionnaires.find(q => q.id === questionnaireIds[0]) : null;
  const headers = ['问卷名称', '部门', '提交时间', ...Q12_QUESTIONS.map(q => q.text), '综合得分'];
  const rows = surveys.map(survey => {
    const q = store.data.questionnaires.find(q => q.id === survey.questionnaire_id);
    const dept = store.data.departments.find(d => d.id === survey.department_id);
    const answers = JSON.parse(survey.answers);
    const scores = Q12_QUESTIONS.map(q => parseInt(answers[q.id]));
    return [q?.title || '', dept?.name || '', survey.submitted_at, ...scores, (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)];
  });

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const filename = questionnaire ? `${questionnaire.title}_` : '';
  res.setHeader('Content-Type', 'text/csv;charset=utf-8');
  res.setHeader('Content-Disposition', `attachment;filename=${filename}q12_survey_results.csv`);
  res.send('\ufeff' + csv);
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`Q12调研系统已启动！`);
  console.log('='.repeat(50));
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`管理后台: http://localhost:${PORT}/admin`);
  console.log(`默认账号: admin / admin123`);
  console.log('='.repeat(50));
});
