import * as axios from 'axios';
import { GLMConfig } from '../types/planner';

// 加载环境变量
import * as dotenv from 'dotenv';
dotenv.config();

// 从环境变量读取 GLM API 配置
const config: GLMConfig = {
  endpoint: process.env.GLM_ENDPOINT || '',
  apiKey: process.env.GLM_API_KEY || '',
  timeout: Number(process.env.GLM_TIMEOUT_MS) || 30000, // 默认 30 秒超时
};

// 创建并配置 axios 实例
const glmClient = axios.create({
  baseURL: config.endpoint,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  },
});

// 请求拦截器
glmClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加额外的请求处理逻辑
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
glmClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 统一错误处理
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('GLM API 请求超时'));
    }
    return Promise.reject(error);
  }
);

export { glmClient, config };