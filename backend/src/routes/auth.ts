import express from 'express';
import { UserModel, UserInput } from '../models/userModel';
import { authMiddleware, generateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// 注册接口
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, avatar_url } = req.body as UserInput;
    
    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码为必填项',
        data: null
      });
    }
    
    // 创建用户
    const user = await UserModel.createUser({
      email,
      password,
      name,
      avatar_url
    });
    
    // 生成令牌
    const token = generateToken(user.id, user.email);
    
    return res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user,
        token
      }
    });
  } catch (error: any) {
    logger.error('注册失败:', error);
    
    // 处理数据库表不存在的特殊情况
    if (error.message && error.message.includes('Could not find the table')) {
      return res.status(503).json({
        success: false,
        message: '系统维护中，请稍后再试',
        data: null
      });
    }
    
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : '注册失败',
      data: null
    });
  }
});

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码为必填项',
        data: null
      });
    }
    
    // 查找用户
    const user = await UserModel.getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
        data: null
      });
    }
    
    // 验证密码
    const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
        data: null
      });
    }
    
    // 生成令牌
    const token = generateToken(user.id, user.email);
    
    return res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    logger.error('登录失败:', error);
    
    return res.status(500).json({
      success: false,
      message: '登录失败',
      data: null
    });
  }
});

// 获取用户资料接口
router.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        data: null
      });
    }
    
    const user = await UserModel.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        data: null
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '获取资料成功',
      data: user
    });
  } catch (error) {
    logger.error('获取用户资料失败:', error);
    
    return res.status(500).json({
      success: false,
      message: '获取资料失败',
      data: null
    });
  }
});

// 更新用户资料接口
router.put('/user/profile', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        data: null
      });
    }
    
    const { name, avatar_url } = req.body;
    
    const updatedUser = await UserModel.updateProfile(req.user.userId, {
      name,
      avatar_url
    });
    
    return res.status(200).json({
      success: true,
      message: '更新资料成功',
      data: updatedUser
    });
  } catch (error) {
    logger.error('更新用户资料失败:', error);
    
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : '更新资料失败',
      data: null
    });
  }
});

export default router;