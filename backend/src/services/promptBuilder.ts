import { PlannerRequest } from '../types/planner';

/**
 * 构建行程规划提示词
 * @param userInput 用户输入的行程需求
 * @returns 格式化的提示词字符串
 */
export const buildPlannerPrompt = (userInput: PlannerRequest): string => {
  const {
    destination,
    startDate,
    endDate,
    budget,
    travelers,
    preferences = '',
  } = userInput;

  // 构建偏好描述
  const preferencesStr = preferences 
    ? `用户特别偏好: ${typeof preferences === 'string' ? preferences.trim() : (Array.isArray(preferences) ? preferences.join('、') : String(preferences))}`
    : '用户没有特别偏好，推荐经典景点和活动';

  // 计算旅行天数
  const start = new Date(startDate);
  const end = new Date(endDate);
  const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 创建结构化提示词
  return `
你是一位专业的旅行规划师，请根据用户的需求生成一份详细的旅行行程计划。行程安排必须具有连贯性，地点之间应考虑地理合理性和实际交通连接。

用户需求信息：
- 目的地: ${destination}
- 旅行日期: ${startDate} 至 ${endDate} (共${tripDays}天)
- 预算: ${budget}元
- 旅行人数: ${travelers}人
- ${preferencesStr}


请严格按照以下格式输出行程计划：
{
  "destination": "字符串，目的地名称",
  "startDate": "字符串，YYYY-MM-DD格式开始日期",
  "endDate": "字符串，YYYY-MM-DD格式结束日期",
  "days": [
    {
      "day": 数字，第几天（从1开始）,
      "date": "字符串，YYYY-MM-DD格式日期",
      "summary": "字符串，当日行程概述",
      "activities": [
        {
          "time": "字符串，活动时间",
          "name": "字符串，活动名称",
          "type": "字符串，活动类型：景点/餐厅/交通/购物/娱乐/住宿/其他",
          "description": "字符串，活动详细描述",
          "location": "字符串，活动地点",
          "duration": "字符串，活动时长",
          "cost": 数字，活动费用（可选）,
          // 交通活动特有字段
          "transportType": "字符串，交通方式：公交/地铁/出租车/步行/其他（交通类型活动必填）",
          "route": "字符串，路线描述（交通类型活动必填）",
          "departure": "字符串，出发地（交通类型活动必填）",
          "destination": "字符串，目的地（交通类型活动必填）",
          // 住宿活动特有字段
          "checkInTime": "字符串，入住时间（住宿类型活动必填）",
          "checkOutTime": "字符串，退房时间（住宿类型活动必填）",
          // 餐厅活动特有字段
          "cuisine": "字符串，菜系（餐厅类型活动必填）",
          "recommendedDishes": ["推荐菜品1", "推荐菜品2"],
          "mealType": "字符串，早/中/晚餐（餐厅类型活动必填）"
        }
        // 所有活动（景点、交通、餐厅、住宿）都必须包含在activities数组中，并按照时间顺序排列
      ]
    }
    // 生成与旅行天数相等的日程安排
  ],
  "summary": "字符串，行程总结和建议",
  "estimatedBudget": 数字，总预算估计金额,
  "accommodationSummary": "字符串，住宿总体建议",
  "transportationSummary": "字符串，交通总体建议",
  "diningSummary": "字符串，美食总体建议",
  "tips": ["实用建议1", "实用建议2", "实用建议3"]
}

重要要求：
1. 请确保生成的格式完全正确，可被程序直接解析，不要返回额外内容
2. 在顶层行程对象中，必须包含destination、startDate、endDate、days、summary、estimatedBudget、accommodationSummary、transportationSummary、diningSummary和tips字段
3. 请为accommodationSummary提供详细的住宿建议，包括推荐区域、酒店类型和预订建议等
4. 请为transportationSummary提供详细的交通建议，包括当地交通选择、交通卡推荐和交通规划等
5. 请为diningSummary提供详细的美食建议，包括当地特色美食、推荐餐厅类型和用餐技巧等
6. 所有活动（景点、交通、餐厅、住宿）都必须统一包含在activities数组中，并严格按照时间顺序排列
7. 交通活动必须包含完整信息：交通方式、路线、出发地、目的地、时长和费用
8. 住宿活动必须包含完整信息：住宿地点、入住/退房时间、费用和详细描述
9. 景点活动必须包含完整信息：景点名称、特色、游览时间、费用等
10. 餐厅活动必须包含完整信息：餐厅名称、菜系、位置、推荐菜品、用餐类型（早/中/晚）
11. 行程安排必须地理连贯，避免地点之间距离过远导致的时间浪费
12. 确保生成的天数与旅行天数完全一致
13. 每个活动必须包含time、name、type和description字段
14. 总预算估计不应超过用户指定的预算
15. 考虑用户偏好，合理安排相关活动和景点
16. 行程必须按照用户需求展示连贯的地点转换流程，如从南京站到夫子庙的交通活动后，接着是游玩夫子庙的景点活动，然后是在附近餐厅用餐的餐厅活动等
17. 所有活动都必须使用type字段明确标识其类型：景点、餐厅、交通、购物、娱乐、住宿或其他
18. 时间安排合理，考虑实际移动所需时间
  `;
  
};