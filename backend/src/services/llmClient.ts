import { glmClient, config } from '../config/glm';
import logger from '../utils/logger';

// 定义响应类型
interface GLMResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  text?: string;
  data?: {
    content?: string;
  }[];
}

// 定义错误类型
interface GLMError extends Error {
  response?: {
    status: number;
    statusText: string;
  };
  request?: any;
  message: string;
}

/**
 * 调用 GLM API 生成行程内容
 * @param prompt 构建好的提示词
 * @returns API 返回的文本内容
 */
export const callGLM = async (prompt: string): Promise<string> => {
  try {
    logger.info('开始调用 GLM API 生成行程');
    
    // 检查必要的配置
    if (!config.endpoint || !config.apiKey) {
      throw new Error('GLM API 配置不完整，请检查环境变量');
    }

    // 准备请求数据
    const requestData = {
      model: 'glm-4-plus', // 假设使用 glm-4 模型，具体根据实际可用模型调整
      messages: [
        {
          role: 'system',
          content: '你是一位专业的旅行规划师，负责生成详细的旅行行程计划。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000, // 根据需要调整最大生成长度
      temperature: 0.7, // 控制生成的随机性
      top_p: 0.9,       // 控制采样范围
      response_format: {
        type: 'text'    // 请求文本格式的响应
      }
    };

    // 发送请求到 GLM API
    const response = await glmClient.post('', requestData);
    
    // 提取和处理响应内容
    let content = '';
    const responseData = response.data as GLMResponse;
    
    // 处理不同的响应格式（根据 GLM API 实际返回格式调整）
    if (responseData.choices?.[0]?.message?.content) {
      content = responseData.choices[0].message.content;
    } else if (responseData.text) {
      content = responseData.text;
    } else if (responseData.data?.[0]?.content) {
      content = responseData.data[0].content;
    } else {
      throw new Error('无法从 GLM API 响应中提取有效内容');
    }

    logger.info('GLM API 调用成功，成功获取行程内容');
    return content;
  } catch (error) {
    logger.error(`GLM API 调用失败: ${(error as Error).message}`);
    const typedError = error as GLMError;
    
    // 处理不同类型的错误
    if (typedError.response) {
      // API 返回了错误状态码
      throw new Error(`GLM API 错误: ${typedError.response.status} ${typedError.response.statusText}`);
    } else if (typedError.request) {
      // 请求已发送但没有收到响应
      throw new Error('GLM API 无响应，请检查网络连接或 API 服务状态');
    } else {
      // 请求配置出错
      throw new Error(`GLM API 请求配置错误: ${typedError.message}`);
    }
  }
};