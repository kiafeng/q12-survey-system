// API 工具 - 使用本地存储（无后端版本）
import {
  localAuth,
  localDepartments,
  localUsers,
  localQuestionnaire,
  localResponses,
  localStats,
  localBackup,
  generateSurveyToken
} from './localStorage';

// 检查是否已登录
export const checkAuth = () => {
  return localAuth.isLoggedIn();
};

// 获取当前用户
export const getCurrentUser = () => {
  return localAuth.getCurrentUser();
};

// 认证相关 API
export const apiAuth = {
  login: (username, password) => {
    return localAuth.login(username, password);
  },
  
  logout: () => {
    localAuth.logout();
  },
  
  changePassword: (oldPassword, newPassword) => {
    const user = localAuth.getCurrentUser();
    return localAuth.changePassword(user.id, oldPassword, newPassword);
  }
};

// 部门管理 API
export const apiDepartments = {
  getAll: () => {
    return { success: true, data: localDepartments.getAll() };
  },
  
  add: (department) => {
    try {
      const result = localDepartments.add(department);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  update: (id, data) => {
    try {
      const result = localDepartments.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  delete: (id) => {
    try {
      localDepartments.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// 用户管理 API
export const apiUsers = {
  getAll: () => {
    return { success: true, data: localUsers.getAll() };
  },
  
  add: (user) => {
    return localUsers.add(user);
  },
  
  update: (id, data) => {
    try {
      const result = localUsers.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  delete: (id) => {
    try {
      localUsers.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// 问卷管理 API
export const apiQuestionnaire = {
  get: () => {
    return { success: true, data: localQuestionnaire.get() };
  },
  
  update: (data) => {
    try {
      const result = localQuestionnaire.update(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  toggle: (isActive) => {
    return { success: true, data: localQuestionnaire.toggle(isActive) };
  }
};

// 回答管理 API
export const apiResponses = {
  getAll: () => {
    return { success: true, data: localResponses.getAll() };
  },
  
  submit: (response) => {
    try {
      const result = localResponses.add(response);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  getByDepartment: (departmentId) => {
    return { success: true, data: localResponses.getByDepartment(departmentId) };
  },
  
  checkSubmitted: (token, fingerprint) => {
    return localResponses.checkSubmitted(token, fingerprint);
  },
  
  delete: (id) => {
    try {
      localResponses.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// 统计分析 API
export const apiStats = {
  getOverview: () => {
    return { success: true, data: localStats.getOverview() };
  },
  
  getDimensionStats: () => {
    return { success: true, data: localStats.getDimensionStats() };
  },
  
  getDepartmentRanking: () => {
    return { success: true, data: localStats.getDepartmentRanking() };
  }
};

// 备份 API
export const apiBackup = {
  export: () => {
    return { success: true, data: localBackup.export() };
  },
  
  import: (data) => {
    return localBackup.import(data);
  }
};

// 问卷链接 API
export const apiSurvey = {
  generateLink: () => {
    const token = generateSurveyToken();
    const baseUrl = window.location.origin;
    return {
      success: true,
      data: {
        token,
        url: `${baseUrl}/survey/${token}`
      }
    };
  },
  
  validateToken: (token) => {
    // 本地版本直接返回成功
    return { success: true, data: { valid: true, token } };
  }
};
