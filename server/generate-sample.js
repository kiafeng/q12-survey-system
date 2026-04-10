#!/usr/bin/env node

/**
 * Q12调研系统 - 示例数据生成脚本
 * 运行此脚本可生成测试数据，方便演示和测试系统功能
 */

const { store, initDatabase, createDefaultAdmin, generateSurveyToken } = require('./database');
const { v4: uuidv4 } = require('uuid');

async function generateSampleData() {
  console.log('正在初始化数据库...');
  initDatabase();
  
  // 清空现有数据（除了管理员）
  store.data.departments = [];
  store.data.users = store.data.users.filter(u => u.username === 'admin');
  store.data.surveys = [];
  store.data.analysis_reports = [];
  
  console.log('正在创建部门和用户...');
  
  // 创建顶级事业部
  const divisions = [
    { name: '华东事业部', code: 'HD1', level: 1 },
    { name: '华南事业部', code: 'HN1', level: 1 },
    { name: '华北事业部', code: 'HB1', level: 1 },
    { name: '技术中心', code: 'TECH', level: 1 }
  ];
  
  const divisionIds = [];
  divisions.forEach(div => {
    const id = uuidv4();
    divisionIds.push(id);
    store.data.departments.push({
      id,
      name: div.name,
      code: div.code,
      parent_id: null,
      level: div.level,
      survey_token: generateSurveyToken(),
      manager_id: null,
      status: 1,
      created_at: new Date().toISOString()
    });
  });
  
  // 创建二级部门
  const subDepts = [
    { name: '华东销售一部', code: 'HD1-S1', parentIdx: 0, level: 2 },
    { name: '华东销售二部', code: 'HD1-S2', parentIdx: 0, level: 2 },
    { name: '华东运营部', code: 'HD1-OP', parentIdx: 0, level: 2 },
    { name: '华南销售部', code: 'HN1-S1', parentIdx: 1, level: 2 },
    { name: '华南市场部', code: 'HN1-MK', parentIdx: 1, level: 2 },
    { name: '华北销售部', code: 'HB1-S1', parentIdx: 2, level: 2 },
    { name: '技术研发部', code: 'TECH-DEV', parentIdx: 3, level: 2 },
    { name: '技术产品部', code: 'TECH-PM', parentIdx: 3, level: 2 }
  ];
  
  const subDeptIds = [];
  subDepts.forEach(dept => {
    const id = uuidv4();
    subDeptIds.push(id);
    store.data.departments.push({
      id,
      name: dept.name,
      code: dept.code,
      parent_id: divisionIds[dept.parentIdx],
      level: dept.level,
      survey_token: generateSurveyToken(),
      manager_id: null,
      status: 1,
      created_at: new Date().toISOString()
    });
  });
  
  // 创建事业部管理员
  const managers = [
    { username: 'manager_hd', realName: '华东事业部长', deptIdx: 0 },
    { username: 'manager_hn', realName: '华南事业部长', deptIdx: 1 },
    { username: 'manager_hb', realName: '华北事业部长', deptIdx: 2 },
    { username: 'manager_tech', realName: '技术中心主任', deptIdx: 3 }
  ];
  
  const bcrypt = require('bcryptjs');
  const passwordHash = bcrypt.hashSync('manager123', 10);
  
  managers.forEach(mgr => {
    store.data.users.push({
      id: uuidv4(),
      username: mgr.username,
      password_hash: passwordHash,
      real_name: mgr.realName,
      role: 2,
      department_id: divisionIds[mgr.deptIdx],
      status: 1,
      created_at: new Date().toISOString()
    });
  });
  
  console.log('正在生成问卷数据...');
  
  // 生成模拟问卷数据
  const Q12_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12'];
  
  // 各部门问卷数量和分数分布
  const deptConfigs = [
    { id: divisionIds[0], count: 150, baseScore: 7.8 }, // 华东 - 较好
    { id: divisionIds[1], count: 120, baseScore: 8.2 }, // 华南 - 好
    { id: divisionIds[2], count: 80, baseScore: 6.5 },   // 华北 - 一般
    { id: divisionIds[3], count: 200, baseScore: 8.5 },  // 技术 - 优秀
    { id: subDeptIds[0], count: 50, baseScore: 7.5 },     // 华东销售一部
    { id: subDeptIds[1], count: 45, baseScore: 8.0 },    // 华东销售二部
    { id: subDeptIds[2], count: 55, baseScore: 7.2 },   // 华东运营部
    { id: subDeptIds[3], count: 70, baseScore: 8.0 },    // 华南销售部
    { id: subDeptIds[4], count: 50, baseScore: 8.5 },   // 华南市场部
    { id: subDeptIds[5], count: 80, baseScore: 6.5 },    // 华北销售部
    { id: subDeptIds[6], count: 120, baseScore: 8.8 },   // 技术研发部
    { id: subDeptIds[7], count: 80, baseScore: 8.2 }     // 技术产品部
  ];
  
  deptConfigs.forEach(config => {
    for (let i = 0; i < config.count; i++) {
      const answers = {};
      Q12_QUESTIONS.forEach((q, idx) => {
        // 添加随机波动 [-1, +1]
        const variance = (Math.random() - 0.5) * 2;
        let score = config.baseScore + variance;
        
        // Q12特定调整 - Q10通常得分较低
        if (idx === 9) score -= 1;
        // Q6通常得分中等
        if (idx === 5) score -= 0.5;
        
        // 确保分数在1-10之间
        score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));
        answers[q] = score;
      });
      
      store.data.surveys.push({
        id: uuidv4(),
        department_id: config.id,
        answers: JSON.stringify(answers),
        ip_hash: `mock-ip-${i}`,
        submitted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  });
  
  store.save();
  
  console.log('='.repeat(60));
  console.log('示例数据生成完成！');
  console.log('='.repeat(60));
  console.log('\n📊 数据统计:');
  console.log(`   - 事业部: ${divisionIds.length} 个`);
  console.log(`   - 二级部门: ${subDeptIds.length} 个`);
  console.log(`   - 事业部管理员: ${managers.length} 个`);
  console.log(`   - 问卷数据: ${store.data.surveys.length} 份`);
  console.log('\n🔐 登录账号:');
  console.log('   超级管理员: admin / admin123');
  console.log('   事业部管理员: manager_hd / manager123 (华东)');
  console.log('               manager_hn / manager123 (华南)');
  console.log('               manager_hb / manager123 (华北)');
  console.log('               manager_tech / manager123 (技术)');
  console.log('\n📋 各事业部问卷链接:');
  divisionIds.forEach((id, idx) => {
    const dept = store.data.departments.find(d => d.id === id);
    console.log(`   ${dept.name}: /survey/${dept.survey_token}`);
  });
  console.log('='.repeat(60));
}

generateSampleData().catch(console.error);
