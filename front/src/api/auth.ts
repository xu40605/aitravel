import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器，添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 用户相关接口
export const authAPI = {
  // 注册
  register: async (data: {
    email: string;
    password: string;
    name?: string;
    avatar_url?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // 登录
  login: async (data: {
    email: string;
    password: string;
  }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // 获取用户资料
  getProfile: async () => {
    const response = await api.get('/auth/user/profile');
    return response.data;
  },

  // 更新用户资料
  updateProfile: async (data: {
    name?: string;
    avatar_url?: string;
  }) => {
    const response = await api.put('/auth/user/profile', data);
    return response.data;
  }
};

export default api;