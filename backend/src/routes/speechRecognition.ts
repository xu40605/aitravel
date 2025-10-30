import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { SpeechService } from '../services/speechService';

const router = express.Router();

// 创建 SpeechService 实例
const speechService = new SpeechService({
  xfApiKey: process.env.XF_API_KEY,
  xfApiSecret: process.env.XF_API_SECRET,
  xfAppId: process.env.XF_APP_ID,
});

// 配置临时文件存储
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 语音识别 API
router.post('/recognize', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未收到音频文件' });
    }

    const { buffer, mimetype, originalname } = req.file;
    console.log(`[语音识别] 接收到音频文件: ${originalname}, 类型: ${mimetype}, 大小: ${buffer.length} 字节`);

    // 使用 SpeechService 的 recognizeWithAutoConvert 方法进行语音识别
    const result = await speechService.recognizeWithAutoConvert(buffer, mimetype);

    console.log(`[语音识别] 识别成功，结果: "${result.text}", 置信度: ${result.confidence}`);
    return res.json({
      result: result.text,
      confidence: result.confidence
    });
  } catch (error) {
    console.error(`[语音识别] API处理失败: ${error}`);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '语音识别服务暂时不可用'
    });
  }
});

export default router;
