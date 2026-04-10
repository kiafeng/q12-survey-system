const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { nanoid } = require('nanoid');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'q12survey.json');

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 简单的JSON文件存储
const store = {
  data: {
    departments: [],
    users: [],
    surveys: [],
    analysis_reports: []
  },

  load() {
    try {
      if (fs.existsSync(dbPath)) {
        this.data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
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

// 初始化
async function initDatabase() {
  store.load();

  // 确保表结构存在
  if (!store.data.departments) store.data.departments = [];
  if (!store.data.users) store.data.users = [];
  if (!store.data.surveys) store.data.surveys = [];
  if (!store.data.analysis_reports) store.data.analysis_reports = [];

  console.log('数据库初始化完成');
}

// 创建默认管理员
function createDefaultAdmin() {
  const existingAdmin = store.data.users.find(u => u.username === 'admin');
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    store.data.users.push({
      id: uuidv4(),
      username: 'admin',
      password_hash: passwordHash,
      real_name: '系统管理员',
      role: 1,
      department_id: null,
      status: 1,
      created_at: new Date().toISOString()
    });
    store.save();
    console.log('默认管理员已创建: admin / admin123');
  }
}

// 生成唯一的survey token
function generateSurveyToken() {
  return nanoid(12);
}

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

// 维度分组
const DIMENSIONS = {
  '基础要求': ['q1'],
  '工作资源': ['q2'],
  '发挥优势': ['q3'],
  '认可表扬': ['q4'],
  '关爱员工': ['q5'],
  '成长发展': ['q6'],
  '尊重意见': ['q7'],
  '使命价值': ['q8'],
  '同事质量': ['q9'],
  '人际关系': ['q10'],
  '进步反馈': ['q11'],
  '学习成长': ['q12']
};

// 简化的数据库操作
const db = {
  prepare(sql) {
    return {
      get(...params) {
        // 简单实现get方法
        const results = this.all(...params);
        return results[0] || null;
      },
      all(...params) {
        // 解析简单的SQL并返回结果
        const lowerSql = sql.toLowerCase();

        if (lowerSql.includes('from departments')) {
          let results = [...store.data.departments];

          if (lowerSql.includes('join')) {
            results = results.map(d => {
              const parent = store.data.departments.find(p => p.id === d.parent_id);
              const manager = store.data.users.find(u => u.id === d.manager_id);
              const surveyCount = store.data.surveys.filter(s => s.department_id === d.id).length;
              return {
                ...d,
                parent_name: parent?.name || null,
                manager_name: manager?.real_name || null,
                survey_count: surveyCount
              };
            });
          }

          if (lowerSql.includes('where')) {
            if (lowerSql.includes('survey_token')) {
              const token = params[0];
              results = results.filter(d => d.survey_token === token && d.status === 1);
            } else if (lowerSql.includes('id = ?')) {
              results = results.filter(d => d.id === params[0]);
            } else if (lowerSql.includes('parent_id = ?')) {
              results = results.filter(d => d.parent_id === params[0]);
            } else if (lowerSql.includes('code = ?')) {
              results = results.filter(d => d.code === params[0]);
            } else if (lowerSql.includes('status = 1')) {
              results = results.filter(d => d.status === 1);
            }
          }

          if (lowerSql.includes('order by')) {
            results.sort((a, b) => {
              const levelA = a.level || 1;
              const levelB = b.level || 1;
              if (levelA !== levelB) return levelA - levelB;
              return (a.name || '').localeCompare(b.name || '');
            });
          }

          return results;
        }

        if (lowerSql.includes('from users')) {
          let results = [...store.data.users];

          if (lowerSql.includes('join')) {
            results = results.map(u => {
              const dept = store.data.departments.find(d => d.id === u.department_id);
              return { ...u, department_name: dept?.name || null };
            });
          }

          if (lowerSql.includes('where')) {
            if (lowerSql.includes('username = ?')) {
              results = results.filter(u => u.username === params[0] && u.status === 1);
            } else if (lowerSql.includes('id = ?')) {
              results = results.filter(u => u.id === params[0]);
            }
          }

          if (lowerSql.includes('order by')) {
            results.sort((a, b) => {
              if ((a.role || 2) !== (b.role || 2)) return (a.role || 2) - (b.role || 2);
              return new Date(b.created_at) - new Date(a.created_at);
            });
          }

          return results;
        }

        if (lowerSql.includes('from surveys')) {
          let results = [...store.data.surveys];

          if (lowerSql.includes('join')) {
            results = results.map(s => {
              const dept = store.data.departments.find(d => d.id === s.department_id);
              return { ...s, department_name: dept?.name || null };
            });
          }

          if (lowerSql.includes('where')) {
            if (lowerSql.includes('department_id = ?')) {
              results = results.filter(s => s.department_id === params[0]);
            } else if (lowerSql.includes('ip_hash = ?')) {
              results = results.filter(s => s.ip_hash === params[1]);
            }
          }

          if (lowerSql.includes('order by')) {
            results.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
          }

          return results;
        }

        if (lowerSql.includes('select count(*)')) {
          if (lowerSql.includes('from surveys')) {
            if (lowerSql.includes('where')) {
              const deptId = params[0];
              return { count: store.data.surveys.filter(s => s.department_id === deptId).length };
            }
            return { count: store.data.surveys.length };
          }
          if (lowerSql.includes('from departments')) {
            return { count: store.data.departments.filter(d => d.status === 1).length };
          }
          return { count: 0 };
        }

        return [];
      },
      run(...params) {
        // 实现run方法 - 这里简化处理
        return { changes: 1 };
      }
    };
  }
};

module.exports = {
  initDatabase,
  createDefaultAdmin,
  generateSurveyToken,
  Q12_QUESTIONS,
  DIMENSIONS,
  store,
  db
};
