import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api',
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

// 定义请求接口
export interface PlannerRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  preferences?: string;
}

// 住宿类型定义
export interface Accommodation {
  name: string;               // 住宿名称
  location: string;           // 住宿位置
  description: string;        // 住宿描述
  checkInTime: string;        // 入住时间
  checkOutTime: string;       // 退房时间
  cost: number;               // 住宿费用
}

// 交通类型定义
export interface Transportation {
  time: string;               // 交通时间
  type: string;               // 交通方式
  route: string;              // 路线描述
  departure: string;          // 出发地
  destination: string;        // 目的地
  duration: string;           // 预计时长
  cost?: number;              // 交通费用
}

// 餐厅类型定义
export interface Restaurant {
  name: string;               // 餐厅名称
  cuisine: string;            // 菜系
  location: string;           // 餐厅位置
  recommendedDishes: string[];// 推荐菜品
  averageCost: string;        // 人均消费
  mealType: string;           // 早/中/晚餐
}

// 活动类型定义
export interface Activity {
  time: string;
  name: string;
  type: string;               // 活动类型：景点/餐厅/交通/购物/娱乐/住宿/其他
  description: string;
  location?: string;
  duration?: string;
  cost?: string | number;     // 支持字符串或数字类型
  // 交通活动特有字段
  transportType?: string;     // 交通方式
  route?: string;             // 路线描述
  departure?: string;         // 出发地
  destination?: string;       // 目的地
  // 住宿活动特有字段
  checkInTime?: string;       // 入住时间
  checkOutTime?: string;      // 退房时间
  // 餐厅活动特有字段
  cuisine?: string;           // 菜系
  recommendedDishes?: string[]; // 推荐菜品
  mealType?: string;          // 早/中/晚餐
}

// 行程日类型定义
export interface ItineraryDay {
  day: number;                // 第几天
  date: string;
  summary: string;            // 当日行程概述
  activities: Activity[];     // 活动列表（包含所有景点、交通、餐厅、住宿活动）
}

// 完整行程类型定义
export interface Itinerary {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  preferences?: string;
  days: ItineraryDay[];
  summary?: string;            // 行程总结和建议
  estimatedBudget: number;    // 总预算估计金额
  accommodationSummary?: string; // 住宿总体建议
  transportationSummary?: string; // 交通总体建议
  diningSummary?: string;      // 美食总体建议
  tips: string[];             // 实用建议列表
  estimatedTotalCost?: string; // 为兼容保留
};

// 定义响应接口
export interface PlannerResponse {
  success: boolean;
  message?: string;
  data?: {
    parsed: Itinerary;
    raw: string;
  };
  details?: string;
}

// 生成行程规划的API调用
export const generateItinerary = async (request: PlannerRequest): Promise<PlannerResponse> => {
  try {
    const response = await api.post<PlannerResponse>('/planner/generate', request);
    return response.data;
  } catch (error) {
    console.error('生成行程失败:', error);
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || '网络错误，请稍后重试',
        details: error.response?.data?.details || error.message,
      };
    }
    return {
      success: false,
      message: '网络错误，请稍后重试',
      details: error instanceof Error ? error.message : undefined,
    };
  }
};