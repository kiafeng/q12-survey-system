// 本地存储工具 - 使用 LocalStorage 模拟数据库
const STORAGE_KEYS = {
  QUESTIONNAIRE: 'q12_questionnaire',
  RESPONSES: 'q12_responses',
  DEPARTMENTS: 'q12_departments',
  USERS: 'q12_users',
  SETTINGS: 'q12_settings'
};

// 初始化默认数据
const initDefaultData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.QUESTIONNAIRE)) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONNAIRE, JSON.stringify({
      id: 'default',
      title: 'Q12组织氛围诊断问卷',
      description: '请根据您最近一个月的工作体验，选择最符合实际情况的选项。',
      isActive: true,
      questions: [
        { id: 1, text: '我知道公司对我的工作要求', dimension: '工作要求' },
        { id: 2, text: '我有做好工作所需的基本材料与设备', dimension: '工具支持' },
        { id: 3, text: '在工作中，我每天都有机会做我最擅长的事', dimension: '发挥特长' },
        { id: 4, text: '在过去的七天里，我因工作出色而受到表扬', dimension: '认可表扬' },
        { id: 5, text: '我觉得我的主管或同事关心我的个人情况', dimension: '关心支持' },
        { id: 6, text: '我在公司有个人发展的机会', dimension: '发展机会' },
        { id: 7, text: '我在工作中感觉自己的意见受到重视', dimension: '意见重视' },
        { id: 8, text: '公司的使命目标使我觉得我的工作重要', dimension: '工作使命' },
        { id: 9, text: '我的同事致力于高质量的工作', dimension: '同事质量' },
        { id: 10, text: '我在公司有一个最好的朋友', dimension: '人际关系' },
        { id: 11, text: '在工作中，我身边都有机会与我探讨如何进步的对话', dimension: '进步对话' },
        { id: 12, text: '我的工作意见有被采纳的机会', dimension: '意见采纳' }
      ],
      createdAt: new Date().toISOString()
    }));
  }

  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify([
      { id: '1', name: '技术部', description: '技术研发团队' },
      { id: '2', name: '市场部', description: '市场营销团队' },
      { id: '3', name: '销售部', description: '销售团队' },
      { id: '4', name: '人事部', description: '人力资源团队' }
    ]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
      { id: 'admin', username: 'admin', password: 'admin123', role: 'admin', department: '人事部', name: '系统管理员' }
    ]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RESPONSES)) {
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify([]));
  }
};

// 初始化
initDefaultData();

// 通用 CRUD 操作
const getAll = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const set = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// 认证相关
export const localAuth = {
  login: (username, password) => {
    const users = getAll(STORAGE_KEYS.USERS);
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const token = btoa(JSON.stringify({ id: user.id, username: user.username, role: user.role }));
      localStorage.setItem('q12_token', token);
      return { success: true, user: { ...user, password: undefined } };
    }
    return { success: false, error: '用户名或密码错误' };
  },

  logout: () => {
    localStorage.removeItem('q12_token');
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('q12_token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  },

  isLoggedIn: () => {
    return !!localStorage.getItem('q12_token');
  },

  changePassword: (userId, oldPassword, newPassword) => {
    const users = getAll(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, error: '用户不存在' };
    if (users[userIndex].password !== oldPassword) return { success: false, error: '原密码错误' };
    
    users[userIndex].password = newPassword;
    set(STORAGE_KEYS.USERS, users);
    return { success: true };
  }
};

// 部门管理
export const localDepartments = {
  getAll: () => getAll(STORAGE_KEYS.DEPARTMENTS),
  
  add: (department) => {
    const departments = getAll(STORAGE_KEYS.DEPARTMENTS);
    department.id = Date.now().toString();
    departments.push(department);
    set(STORAGE_KEYS.DEPARTMENTS, departments);
    return department;
  },
  
  update: (id, data) => {
    const departments = getAll(STORAGE_KEYS.DEPARTMENTS);
    const index = departments.findIndex(d => d.id === id);
    if (index !== -1) {
      departments[index] = { ...departments[index], ...data };
      set(STORAGE_KEYS.DEPARTMENTS, departments);
      return departments[index];
    }
    return null;
  },
  
  delete: (id) => {
    const departments = getAll(STORAGE_KEYS.DEPARTMENTS);
    const filtered = departments.filter(d => d.id !== id);
    set(STORAGE_KEYS.DEPARTMENTS, filtered);
  }
};

// 用户管理
export const localUsers = {
  getAll: () => {
    const users = getAll(STORAGE_KEYS.USERS);
    return users.map(u => ({ ...u, password: undefined }));
  },
  
  add: (user) => {
    const users = getAll(STORAGE_KEYS.USERS);
    if (users.find(u => u.username === user.username)) {
      return { success: false, error: '用户名已存在' };
    }
    user.id = Date.now().toString();
    users.push(user);
    set(STORAGE_KEYS.USERS, users);
    return { success: true, user: { ...user, password: undefined } };
  },
  
  update: (id, data) => {
    const users = getAll(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      set(STORAGE_KEYS.USERS, users);
      return users[index];
    }
    return null;
  },
  
  delete: (id) => {
    if (id === 'admin') return;
    const users = getAll(STORAGE_KEYS.USERS);
    const filtered = users.filter(u => u.id !== id);
    set(STORAGE_KEYS.USERS, filtered);
  }
};

// 问卷管理
export const localQuestionnaire = {
  get: () => getAll(STORAGE_KEYS.QUESTIONNAIRE),
  
  update: (data) => {
    const questionnaire = getAll(STORAGE_KEYS.QUESTIONNAIRE);
    const updated = { ...questionnaire, ...data };
    set(STORAGE_KEYS.QUESTIONNAIRE, updated);
    return updated;
  },
  
  toggle: (isActive) => {
    return localQuestionnaire.update({ isActive });
  }
};

// 回答管理
export const localResponses = {
  getAll: () => getAll(STORAGE_KEYS.RESPONSES),
  
  add: (response) => {
    const responses = getAll(STORAGE_KEYS.RESPONSES);
    response.id = Date.now().toString();
    response.createdAt = new Date().toISOString();
    responses.push(response);
    set(STORAGE_KEYS.RESPONSES, responses);
    return response;
  },
  
  getByToken: (token) => {
    const responses = getAll(STORAGE_KEYS.RESPONSES);
    return responses.filter(r => r.token === token);
  },
  
  getByDepartment: (departmentId) => {
    const responses = getAll(STORAGE_KEYS.RESPONSES);
    return responses.filter(r => r.departmentId === departmentId);
  },
  
  checkSubmitted: (token, fingerprint) => {
    const responses = getAll(STORAGE_KEYS.RESPONSES);
    return responses.some(r => r.token === token && r.fingerprint === fingerprint);
  },
  
  delete: (id) => {
    const responses = getAll(STORAGE_KEYS.RESPONSES);
    const filtered = responses.filter(r => r.id !== id);
    set(STORAGE_KEYS.RESPONSES, filtered);
  }
};

// 统计分析
export const localStats = {
  getOverview: () => {
    const responses = getAll(STORAGE_KEYS.RESPONSES);
    const departments = getAll(STORAGE_KEYS.DEPARTMENTS);
    
    return {
      totalResponses: responses.length,
      totalDepartments: departments.length,
      avgScore: responses.length > 0 
        ? (responses.reduce((sum, r) => sum + r.scores.reduce((s, score) => s + score, 0), 0) / (responses.length * 12)).toFixed(2)
        : 0
    };
  },
  
  getDimensionStats: () => {
    const responses = getAll(STORAGE_KEYS.RESPONSES);
    const dimensions = ['工作要求', '工具支持', '发挥特长', '认可表扬', '关心支持', '发展机会', '意见重视', '工作使命', '同事质量', '人际关系', '进步对话', '意见采纳'];
    
    const dimensionScores = {};
    dimensions.forEach(d => dimensionScores[d] = []);
    
    responses.forEach(r => {
      r.scores.forEach((score, index) => {
        const dim = dimensions[index];
        if (dim) dimensionScores[dim].push(score);
      });
    });
    
    return Object.entries(dimensionScores).map(([dimension, scores]) => ({
      dimension,
      avgScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0,
      count: scores.length
    }));
  },
  
  getDepartmentRanking: () => {
    const responses = getAll(STORAGE_KEYS.RESPONSES);
    const departments = getAll(STORAGE_KEYS.DEPARTMENTS);
    
    const deptStats = departments.map(dept => {
      const deptResponses = responses.filter(r => r.departmentId === dept.id);
      const avgScore = deptResponses.length > 0
        ? (deptResponses.reduce((sum, r) => sum + r.scores.reduce((s, score) => s + score, 0), 0) / (deptResponses.length * 12)).toFixed(2)
        : 0;
      return {
        department: dept.name,
        departmentId: dept.id,
        responseCount: deptResponses.length,
        avgScore: parseFloat(avgScore)
      };
    });
    
    return deptStats.sort((a, b) => b.avgScore - a.avgScore);
  }
};

// 导入导出
export const localBackup = {
  export: () => {
    return {
      departments: getAll(STORAGE_KEYS.DEPARTMENTS),
      users: getAll(STORAGE_KEYS.USERS).map(u => ({ ...u, password: undefined })),
      questionnaire: getAll(STORAGE_KEYS.QUESTIONNAIRE),
      responses: getAll(STORAGE_KEYS.RESPONSES),
      exportedAt: new Date().toISOString()
    };
  },
  
  import: (data) => {
    if (data.departments) set(STORAGE_KEYS.DEPARTMENTS, data.departments);
    if (data.users) set(STORAGE_KEYS.USERS, data.users);
    if (data.questionnaire) set(STORAGE_KEYS.QUESTIONNAIRE, data.questionnaire);
    if (data.responses) set(STORAGE_KEYS.RESPONSES, data.responses);
    return { success: true };
  }
};

// 生成问卷链接 token
export const generateSurveyToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};
