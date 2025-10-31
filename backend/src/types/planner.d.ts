// 行程规划请求接口
export interface PlannerRequest {
  destination: string;         // 目的地
  startDate: string;           // 开始日期 YYYY-MM-DD
  endDate: string;             // 结束日期 YYYY-MM-DD
  budget: number;              // 预算金额
  travelers: number;           // 旅行人数
  preferences?: string | string[];      // 偏好，字符串或偏好列表
}

// 行程响应接口
export interface PlannerResponse {
  success: boolean;
  data?: {
    raw: string;
    parsed?: Itinerary;
  };
  message?: string;
}

// 住宿接口
export interface Accommodation {
  name: string;               // 住宿名称
  location: string;           // 住宿位置
  description: string;        // 住宿描述
  checkInTime: string;        // 入住时间
  checkOutTime: string;       // 退房时间
  cost: number;               // 住宿费用
}

// 交通接口
export interface Transportation {
  time: string;               // 交通时间
  type: string;               // 交通方式
  route: string;              // 路线描述
  departure: string;          // 出发地
  destination: string;        // 目的地
  duration: string;           // 预计时长
  cost?: number;              // 交通费用
}

// 餐厅接口
export interface Restaurant {
  name: string;               // 餐厅名称
  cuisine: string;            // 菜系
  location: string;           // 餐厅位置
  recommendedDishes: string[];// 推荐菜品
  averageCost: string;        // 人均消费
  mealType: string;           // 早/中/晚餐
}

// 活动接口
export interface Activity {
  time: string;               // 活动时间
  name: string;               // 活动名称
  type: string;               // 活动类型：景点/餐厅/交通/购物/娱乐/住宿/其他
  description: string;        // 活动详细描述
  location?: string;          // 活动地点
  duration?: string;          // 活动时长
  cost?: number;              // 活动费用
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

// 每日行程接口
export interface ItineraryDay {
  day: number;                // 第几天
  date: string;               // 日期
  summary: string;            // 当日行程概述
  activities: Activity[];     // 活动列表（包含所有景点、交通、餐厅、住宿活动）
}

// 完整行程接口
export interface Itinerary {
  destination: string;        // 目的地
  startDate: string;          // 开始日期
  endDate: string;            // 结束日期
  days: ItineraryDay[];       // 每日行程
  summary: string;            // 行程总结和建议
  estimatedBudget: number;    // 总预算估计金额
  accommodationSummary?: string; // 住宿总体建议
  transportationSummary?: string; // 交通总体建议
  diningSummary?: string;      // 美食总体建议
  tips?: string[];            // 实用建议列表
}

/**
 * 保存的行程接口，继承Itinerary并添加数据库相关字段
 */
export interface SavedItinerary extends Itinerary {
  id: string;
  name: string;
  createdAt: string;
}

// GLM API 配置接口
export interface GLMConfig {
  endpoint: string;
  apiKey: string;
  timeout: number;
}