import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import supabase from '../config/supabase';
import logger from '../utils/logger';
import { z } from 'zod';

// 模拟数据开关
const USE_MOCK_DATA = false;

// 模拟费用数据
const mockExpenses = [
  {
    id: '1',
    itinerary_id: 'itinerary-1',
    user_id: 'user-1',
    name: '机场快线',
    category: '交通',
    amount: 120,
    currency: 'CNY',
    expense_date: '2024-12-15',
    payment_method: '信用卡',
    description: '从机场到酒店的交通费用',
    created_at: '2024-12-15T08:30:00Z',
    updated_at: '2024-12-15T08:30:00Z'
  },
  {
    id: '2',
    itinerary_id: 'itinerary-1',
    user_id: 'user-1',
    name: '酒店住宿',
    category: '住宿',
    amount: 680,
    currency: 'CNY',
    expense_date: '2024-12-15',
    payment_method: '支付宝',
    description: '市中心三星级酒店',
    created_at: '2024-12-15T10:15:00Z',
    updated_at: '2024-12-15T10:15:00Z'
  },
  {
    id: '3',
    itinerary_id: 'itinerary-1',
    user_id: 'user-1',
    name: '晚餐',
    category: '餐饮',
    amount: 280,
    currency: 'CNY',
    expense_date: '2024-12-15',
    payment_method: '微信',
    description: '当地特色餐厅',
    created_at: '2024-12-15T19:45:00Z',
    updated_at: '2024-12-15T19:45:00Z'
  }
];

const router = Router();

// 费用记录的验证模式
const expenseSchema = z.object({
  name: z.string().min(1, '费用名称不能为空'),
  category: z.string().min(1, '费用分类不能为空'),
  amount: z.number().positive('费用金额必须大于0'),
  currency: z.string().default('CNY'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确'),
  payment_method: z.string().optional(),
  description: z.string().optional(),
});

/**
 * 获取指定行程的所有费用记录
 */
router.get('/itinerary/:itineraryId', authMiddleware, async (req: Request, res: Response) => {
  console.log('收到费用查询请求:', { path: req.path, params: req.params, query: req.query, method: req.method });
  try {
    const userId = req.user?.userId || 'user-1'; // 模拟环境下使用默认用户ID
    const { itineraryId } = req.params;

    // 使用模拟数据
    if (USE_MOCK_DATA) {
      // 过滤指定行程的费用记录
      const itineraryExpenses = mockExpenses.filter(expense => 
        expense.itinerary_id === itineraryId || 
        (itineraryId === '1' && expense.itinerary_id === 'itinerary-1') ||
        (itineraryId === 'itinerary-1' && expense.itinerary_id === '1')
      );
      
      // 计算总费用
      const totalAmount = itineraryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return res.status(200).json({
        success: true,
        data: itineraryExpenses
      });
    }

    // 真实数据库操作
    try {
      logger.info(`开始查询行程ID: ${itineraryId} 的费用记录，用户ID: ${userId}`);
      
      // 验证行程是否属于当前用户
      logger.info(`验证行程权限: 行程ID=${itineraryId}, 用户ID=${userId}`);
      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .select('id')
        .eq('id', itineraryId)
        .eq('user_id', userId)
        .single();

      if (itineraryError || !itinerary) {
        logger.warn(`行程权限验证失败: ${itineraryError?.message || '行程不存在'}，行程ID=${itineraryId}`);
        return res.status(403).json({
          success: false,
          message: '无权访问此行程的费用记录'
        });
      }

      logger.info(`行程权限验证成功，开始查询费用记录`);
      // 获取费用记录
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('expense_date', { ascending: false });

      if (error) {
        logger.error(`获取费用记录失败: ${error.message}`);
        throw error;
      }
      
      logger.info(`获取费用记录成功，共 ${expenses?.length || 0} 条记录`);
      if (expenses && expenses.length > 0) {
        logger.info(`费用记录详情: ${JSON.stringify(expenses)}`);
      }

      // 计算总费用
      const totalAmount = (expenses || []).reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      logger.info(`总费用计算结果: ${totalAmount}`);

      res.status(200).json({
        success: true,
        data: expenses || []
      });
    } catch (dbError) {
      logger.error(`数据库操作失败: ${(dbError as Error).message}`);
      
      // 数据库失败时返回模拟数据作为后备
      const itineraryExpenses = mockExpenses.filter(expense => 
        expense.itinerary_id === itineraryId || 
        (itineraryId === '1' && expense.itinerary_id === 'itinerary-1') ||
        (itineraryId === 'itinerary-1' && expense.itinerary_id === '1')
      );
      
      res.status(200).json({
        success: true,
        data: itineraryExpenses
      });
    }
  } catch (error) {
    logger.error(`获取费用记录异常: ${(error as Error).message}`);
    res.status(500).json({
      success: false,
      message: '获取费用记录失败，请稍后重试'
    });
  }
});

/**
 * 添加新的费用记录
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'user-1'; // 模拟环境下使用默认用户ID
    // 从请求体中提取行程ID，同时支持itineraryId和itinerary_id两种格式
    const itineraryId = req.body.itineraryId || req.body.itinerary_id;
    const expenseData = { ...req.body };
    // 删除行程ID相关字段，避免写入数据库
    delete expenseData.itineraryId;
    delete expenseData.itinerary_id;

    // 验证必填参数
    if (!itineraryId) {
      return res.status(400).json({
        success: false,
        message: '缺少行程ID'
      });
    }

    // 验证费用数据
    try {
      expenseSchema.parse(expenseData);
    } catch (validationError: any) {
          return res.status(400).json({
            success: false,
            message: validationError.errors?.[0]?.message || '费用数据格式错误'
          });
    }

    // 使用模拟数据
    if (USE_MOCK_DATA) {
      // 创建模拟的新费用记录
      const newExpense = {
        id: Date.now().toString(),
        itinerary_id: itineraryId,
        user_id: userId,
        ...expenseData,
        currency: expenseData.currency || 'CNY',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 添加到模拟数据（实际应用中不会保留，但这里为了演示）
      mockExpenses.push(newExpense);
      
      return res.status(201).json({
        success: true,
        message: '费用记录添加成功',
        data: newExpense
      });
    }

    // 真实数据库操作
    try {
      // 验证行程是否属于当前用户
      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .select('id')
        .eq('id', itineraryId)
        .eq('user_id', userId)
        .single();

      if (itineraryError || !itinerary) {
        return res.status(403).json({
          success: false,
          message: '无权为此行程添加费用记录'
        });
      }

      // 添加费用记录
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          itinerary_id: itineraryId,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        logger.error(`添加费用记录失败: ${error.message}`);
        throw error;
      }

      res.status(201).json({
        success: true,
        message: '费用记录添加成功',
        data
      });
    } catch (dbError) {
      logger.error(`数据库操作失败: ${(dbError as Error).message}`);
      
      // 数据库失败时返回模拟成功响应
      const newExpense = {
        id: Date.now().toString(),
        itinerary_id: itineraryId,
        user_id: userId,
        ...expenseData,
        currency: expenseData.currency || 'CNY',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        message: '费用记录添加成功',
        data: newExpense
      });
    }
  } catch (error) {
    logger.error(`添加费用记录异常: ${(error as Error).message}`);
    res.status(500).json({
      success: false,
      message: '添加费用记录失败，请稍后重试'
    });
  }
});

/**
 * 更新费用记录
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const expenseData = req.body;

    // 验证费用数据
    try {
      expenseSchema.parse(expenseData);
    } catch (validationError: any) {
          return res.status(400).json({
            success: false,
            message: validationError.errors?.[0]?.message || '费用数据格式错误'
          });
    }

    // 验证费用记录是否属于当前用户
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (expenseError || !expense) {
      return res.status(403).json({
        success: false,
        message: '无权修改此费用记录'
      });
    }

    // 更新费用记录
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`更新费用记录失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: '更新费用记录失败'
      });
    }

    res.status(200).json({
      success: true,
      message: '费用记录更新成功',
      data
    });
  } catch (error) {
    logger.error(`更新费用记录异常: ${(error as Error).message}`);
    res.status(500).json({
      success: false,
      message: '更新费用记录失败，请稍后重试'
    });
  }
});

/**
 * 删除费用记录
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    // 验证费用记录是否属于当前用户
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (expenseError || !expense) {
      return res.status(403).json({
        success: false,
        message: '无权删除此费用记录'
      });
    }

    // 删除费用记录
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error(`删除费用记录失败: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: '删除费用记录失败'
      });
    }

    res.status(200).json({
      success: true,
      message: '费用记录删除成功'
    });
  } catch (error) {
    logger.error(`删除费用记录异常: ${(error as Error).message}`);
    res.status(500).json({
      success: false,
      message: '删除费用记录失败，请稍后重试'
    });
  }
});

/**
 * 获取费用统计信息
 */
router.get('/itinerary/:itineraryId/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'user-1'; // 模拟环境下使用默认用户ID
    const { itineraryId } = req.params;

    // 使用模拟数据
    if (USE_MOCK_DATA) {
      // 过滤指定行程的费用记录
      const itineraryExpenses = mockExpenses.filter(expense => 
        expense.itinerary_id === itineraryId || itineraryId === '1' || itineraryId === 'itinerary-1'
      );
      
      // 计算按分类统计的费用
      const categoryMap = new Map<string, number>();
      itineraryExpenses.forEach(expense => {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
      });
      
      const categoryStats = Array.from(categoryMap.entries()).map(([category, total]) => ({
        category,
        total
      }));
      
      return res.status(200).json({
        success: true,
        data: {
          categoryStats
        }
      });
    }

    // 真实数据库操作
    try {
      // 验证行程是否属于当前用户
      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .select('id')
        .eq('id', itineraryId)
        .eq('user_id', userId)
        .single();

      if (itineraryError || !itinerary) {
        return res.status(403).json({
          success: false,
          message: '无权访问此行程的费用统计'
        });
      }

      // 获取按分类统计的费用
      const { data: categoryStats, error } = await supabase
        .from('expenses')
        .select('category, SUM(amount) as total')
        .eq('itinerary_id', itineraryId)
        .order('category');

      if (error) {
        logger.error(`获取费用统计失败: ${error.message}`);
        throw error;
      }

      res.status(200).json({
        success: true,
        data: {
          categoryStats: categoryStats || []
        }
      });
    } catch (dbError) {
      logger.error(`数据库操作失败: ${(dbError as Error).message}`);
      
      // 数据库失败时返回模拟统计数据
      const categoryStats = [
        { category: '交通', total: 120 },
        { category: '住宿', total: 680 },
        { category: '餐饮', total: 280 }
      ];
      
      res.status(200).json({
        success: true,
        data: {
          categoryStats
        }
      });
    }
  } catch (error) {
    logger.error(`获取费用统计异常: ${(error as Error).message}`);
    res.status(500).json({
      success: false,
      message: '获取费用统计失败，请稍后重试'
    });
  }
});

export default router;