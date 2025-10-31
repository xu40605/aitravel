import axios from 'axios';

// 费用记录类型定义
export interface Expense {
  id: string;
  itinerary_id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  payment_method?: string;
  description?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

// 费用记录创建/更新请求类型
export interface ExpenseRequest {
  name: string;
  category: string;
  amount: number;
  currency?: string;
  expense_date: string;
  payment_method?: string;
  description?: string;
  receipt_url?: string;
}

// 费用记录响应类型
export interface ExpenseResponse {
  success: boolean;
  message?: string;
  data?: Expense | Expense[] | any;
}

// 费用统计类型
export interface CategoryStat {
  category: string;
  total: number;
}

// 费用统计响应类型
export interface ExpenseStatsResponse {
  success: boolean;
  message?: string;
  data?: {
    categoryStats: CategoryStat[];
  };
}

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器添加token
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

/**
 * 获取指定行程的所有费用记录
 */
export const getExpenses = async (itineraryId: string): Promise<ExpenseResponse> => {
  try {
    const response = await api.get(`/expenses/itinerary/${itineraryId}`);
    return response.data;
  } catch (error) {
    console.error('获取费用记录失败:', error);
    throw error;
  }
};

/**
 * 添加新的费用记录
 */
export const addExpense = async (itineraryId: string, expense: ExpenseRequest): Promise<ExpenseResponse> => {
  try {
    const response = await api.post('/expenses', {
      itineraryId: itineraryId,
      ...expense
    });
    return response.data;
  } catch (error) {
    console.error('添加费用记录失败:', error);
    throw error;
  }
};

/**
 * 更新费用记录
 */
export const updateExpense = async (expenseId: string, expense: ExpenseRequest): Promise<ExpenseResponse> => {
  try {
    const response = await api.put(`/expenses/${expenseId}`, expense);
    return response.data;
  } catch (error) {
    console.error('更新费用记录失败:', error);
    throw error;
  }
};

/**
 * 删除费用记录
 */
export const deleteExpense = async (expenseId: string): Promise<ExpenseResponse> => {
  try {
    const response = await api.delete(`/expenses/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error('删除费用记录失败:', error);
    throw error;
  }
};

/**
 * 获取费用统计信息
 */
export const getExpenseStats = async (itineraryId: string): Promise<ExpenseStatsResponse> => {
  try {
    const response = await api.get(`/expenses/itinerary/${itineraryId}/stats`);
    return response.data;
  } catch (error) {
    console.error('获取费用统计失败:', error);
    throw error;
  }
};

// 费用分类选项
export const expenseCategories = [
  { value: '餐饮', label: '餐饮' },
  { value: '交通', label: '交通' },
  { value: '住宿', label: '住宿' },
  { value: '门票', label: '门票' },
  { value: '购物', label: '购物' },
  { value: '娱乐', label: '娱乐' },
  { value: '其他', label: '其他' },
];

// 支付方式选项
export const paymentMethods = [
  { value: '现金', label: '现金' },
  { value: '微信', label: '微信' },
  { value: '支付宝', label: '支付宝' },
  { value: '信用卡', label: '信用卡' },
  { value: '借记卡', label: '借记卡' },
  { value: '其他', label: '其他' },
];