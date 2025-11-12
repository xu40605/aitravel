interface RecognizeResult {
  result?: string;
  error?: string;
}

export class VoiceApi {
  async recognize(audioData: Blob | ArrayBuffer): Promise<RecognizeResult> {
    try {
      // 【日志】语音识别开始
      console.log('[语音识别] 开始处理语音输入');
      
      // 【日志】检查输入数据
      console.log(`[语音识别] 接收到语音数据 - 类型: ${audioData instanceof Blob ? 'Blob' : 'ArrayBuffer'}`);
      if (audioData instanceof Blob) {
        console.log(`[语音识别] 语音数据大小: ${audioData.size} 字节, 类型: ${audioData.type}`);
      } else if (audioData instanceof ArrayBuffer) {
        console.log(`[语音识别] 语音数据大小: ${audioData.byteLength} 字节`);
      }

      // 对于ArrayBuffer类型，转换为Blob
      let audioBlob: Blob;
      if (audioData instanceof ArrayBuffer) {
        console.log('[语音识别] 将ArrayBuffer转换为Blob');
        audioBlob = new Blob([audioData], { type: 'audio/wav' });
        console.log(`[语音识别] 转换后Blob大小: ${audioBlob.size} 字节`);
      } else {
        audioBlob = audioData;
      }
      
      // 调用后端API进行语音识别
      console.log('[语音识别] 调用后端语音识别API');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      // 获取后端API基础URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      // 确保URL路径正确，避免重复的/api前缀
      const basePath = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
      const apiUrl = `${basePath}/speech/recognize`;
      
      console.log(`[语音识别] 发送请求到: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `请求失败: ${response.status}`;
        console.error(`[语音识别] 后端API请求失败: ${errorMessage}`);
        return { error: errorMessage };
      }
      
      const data = await response.json();
      console.log('[语音识别] 后端API返回结果:', data);
      
      return {
        result: data.result || '',
        error: data.error
      };
    } catch (error) {
        console.error('语音识别失败:', error);
        return {
          error: error instanceof Error ? error.message : '语音识别服务暂时不可用'
        };
      }
    }
  }

// 创建并导出VoiceApi的单例实例
export const voiceApi = new VoiceApi();