import { Router, Request, Response, NextFunction } from 'express';
import { PlannerRequest, PlannerResponse, Itinerary } from '../types/planner';
import { buildPlannerPrompt } from '../services/promptBuilder';
import { callGLM } from '../services/llmClient';
import { logger } from '../utils/logger';
import supabase from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * 验证请求数据
 */
const validatePlannerRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { destination, startDate, endDate, budget, travelers } = req.body;
  
  // 检查必填字段
  if (!destination || !startDate || !endDate || !budget || !travelers) {
    res.status(400).json({
      success: false,
      message: '缺少必要的请求参数'
    });
    return;
  }
  
  // 验证日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    res.status(400).json({
      success: false,
      message: '日期格式不正确，请使用 YYYY-MM-DD 格式'
    });
    return;
  }
  
  // 验证预算和人数
  if (budget <= 0 || travelers <= 0) {
    res.status(400).json({
      success: false,
      message: '预算和人数必须大于0'
    });
    return;
  }
  
  // 验证结束日期不能早于开始日期
  if (new Date(endDate) < new Date(startDate)) {
    res.status(400).json({
      success: false,
      message: '结束日期不能早于开始日期'
    });
    return;
  }
  
  next();
};

/**
 * 尝试解析 JSON 响应
 */
const tryParseItinerary = (rawText: string): Itinerary | undefined => {
  try {
    logger.info(`尝试解析行程 JSON: ${rawText}`);
    
    // 处理常见的代码块格式，如 ```json{}```
    let cleanText = rawText.trim();
    
    // 移除可能的代码块标记
    cleanText = cleanText.replace(/^```json|```$/g, '').trim();
    
    // 尝试解析清理后的文本
    const parsed = JSON.parse(cleanText);
    
    // 验证是否包含必要字段
    if (parsed.destination && parsed.startDate && parsed.endDate && Array.isArray(parsed.days)) {
      return parsed as Itinerary;
    }
    
    // 如果直接解析失败，尝试提取 JSON 部分
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedExtracted = JSON.parse(jsonMatch[0]);
      if (parsedExtracted.destination && parsedExtracted.startDate && parsedExtracted.endDate && Array.isArray(parsedExtracted.days)) {
        return parsedExtracted as Itinerary;
      }
    }
    
    return undefined;
  } catch (error) {
    logger.warn(`无法解析行程 JSON: ${(error as Error).message}`);
    return undefined;
  }
};

/**
 * 生成行程计划
 */
router.post('/generate', validatePlannerRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const userInput = req.body as PlannerRequest;
    logger.info(`收到行程规划请求: ${userInput.destination}`, { userInput });
    
    // 构建提示词
    const prompt = buildPlannerPrompt(userInput);
    
    // 调用 GLM API
    const rawResponse = await callGLM(prompt);
    
    // 尝试解析行程数据
    const parsedItinerary = tryParseItinerary(rawResponse);
    
    // 构建响应
    const response: PlannerResponse = {
      success: true,
      data: {
        raw: rawResponse,
        parsed: parsedItinerary
      }
    };
    
    logger.info('行程规划成功完成', { destination: userInput.destination, hasParsedData: !!parsedItinerary });
    res.status(200).json(response);
  } catch (error) {
    logger.error(`行程规划失败: ${(error as Error).message}`);
    
    // 返回统一格式的错误响应
    res.status(500).json({
      success: false,
      message: (error as Error).message || '生成行程计划失败'
    });
  }
});

/**
 * 保存行程计划
 */
router.post('/save', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { name, itinerary } = req.body;
    
    if (!name || !itinerary) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的请求参数'
      });
    }

    // 保存到数据库
    const { data, error } = await supabase
      .from('itineraries')
      .insert({
        user_id: userId,
        name,
        itinerary_data: itinerary,
        destination: itinerary.destination,
        start_date: itinerary.startDate,
        end_date: itinerary.endDate
      })
      .select()
      .single();

    if (error) {
      logger.error(`保存行程失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: '保存行程失败'
      });
    }

    // 构建响应数据
    const savedItinerary = {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      ...data.itinerary_data
    };

    res.status(200).json({
      success: true,
      message: '行程保存成功',
      data: savedItinerary
    });
  } catch (error) {
    logger.error(`保存行程异常: ${(error as Error).message}`);
    res.status(500).json({
      success: false,
      message: '保存行程失败，请稍后重试'
    });
  }
});

/**
 * 获取用户保存的所有行程
 */
router.get('/list', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    // 从数据库获取行程列表
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`获取行程列表失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: '获取行程列表失败'
      });
    }

    // 构建响应数据
    const savedItineraries = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      createdAt: item.created_at,
      ...item.itinerary_data
    }));

    res.status(200).json({
      success: true,
      data: savedItineraries
    });
  } catch (error) {
    logger.error(`获取行程列表异常: ${(error as Error).message}`);
    res.status(500).json({
      success: false,
      message: '获取行程列表失败，请稍后重试'
    });
  }
});

/**
 * 删除行程计划
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // 先检查行程是否存在且属于当前用户
    const { data: existingItinerary, error: checkError } = await supabase
      .from('itineraries')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Record not found
        return res.status(404).json({
          success: false,
          message: '行程不存在'
        });
      }
      logger.error(`检查行程失败: ${checkError.message}`);
      return res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }

    // 删除行程
    const { error: deleteError } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error(`删除行程失败: ${deleteError.message}`);
      return res.status(500).json({
        success: false,
        message: '删除行程失败'
      });
    }

    res.status(200).json({
      success: true,
      message: '行程删除成功'
    });
  } catch (error) {
    logger.error(`删除行程异常: ${(error as Error).message}`);
    res.status(500).json({
      success: false,
      message: '删除行程失败，请稍后重试'
    });
  }
});

export default router;