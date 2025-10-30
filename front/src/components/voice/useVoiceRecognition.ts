import { useState, useCallback, useRef } from 'react';
import { voiceApi } from './voiceApi';

interface UseVoiceRecognitionProps {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceRecognitionReturn {
  isRecording: boolean;
  recognizedText: string;
  startRecording: () => void;
  stopRecording: () => void;
  clearText: () => void;
}

export const useVoiceRecognition = ({
  onResult,
  onError,
}: UseVoiceRecognitionProps = {}): UseVoiceRecognitionReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  
  // 使用useRef存储音频块，避免React闭包陷阱
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // 获取麦克风权限
      console.log('[语音录制] 请求麦克风权限...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log('[语音录制] ✅ 已获取麦克风权限');
      
      // 创建 MediaRecorder - 添加格式选择，优先使用PCM格式以兼容科大讯飞API
      const options = {
        mimeType: 'audio/webm;codecs=pcm' // 尝试使用PCM编码
      };
      
      // 检查浏览器支持的MIME类型
      let mediaRecorder;
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(`[语音录制] 使用首选格式: ${options.mimeType}`);
        mediaRecorder = new MediaRecorder(stream, options);
      } else {
        // 如果不支持PCM，则让浏览器选择支持的格式
        console.log('[语音录制] 首选格式不支持，使用浏览器默认格式');
        mediaRecorder = new MediaRecorder(stream);
      }
      
      console.log(`[语音录制] 实际使用的MIME类型: ${mediaRecorder.mimeType}`);
      
      mediaRecorderRef.current = mediaRecorder;
      // 使用ref存储音频块，避免闭包问题
      audioChunksRef.current = [];
      setRecognizedText('');
      setIsRecording(true);
      console.log('[语音录制] 开始录音...');

      // 监听数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`[语音录制] 收到音频数据块，大小: ${event.data.size} 字节`);
          audioChunksRef.current.push(event.data);
        } else {
          console.log('[语音录制] 收到空音频数据块，跳过');
        }
      };
      
      // 监听开始事件
      mediaRecorder.onstart = () => {
        console.log('[语音录制] ✅ 录音已开始');
      };
      
      // 监听错误事件
      mediaRecorder.onerror = (event) => {
        console.error('[语音录制] ❌ 录音过程出错:', event.error);
      };

      // 开始录音
      mediaRecorder.start();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '无法访问麦克风';
      console.error('开始录音失败:', error);
      setIsRecording(false);
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [onError]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) {
      console.log('[语音录制] 停止录音: 当前未在录音');
      return;
    }

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        if (streamRef.current) {
          console.log('[语音录制] 停止麦克风流');
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        try {
            // 检查收集到的音频块（从ref中获取最新数据）
            const audioChunks = audioChunksRef.current;
            console.log(`[语音录制] 录音停止，收集到 ${audioChunks.length} 个音频数据块`);
            
            // 检查每个数据块的大小
            if (audioChunks.length > 0) {
              const totalSize = audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
              console.log(`[语音录制] 音频数据总大小: ${totalSize} 字节`);
            }
            
            // 合并音频数据 - 使用与录制相同的MIME类型
            let mimeType = 'audio/webm'; // 默认类型
            if (mediaRecorderRef.current) {
              mimeType = mediaRecorderRef.current.mimeType;
            }
            
            console.log(`[语音录制] 创建音频Blob，使用MIME类型: ${mimeType}`);
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            console.log(`[语音录制] 合并后的音频Blob大小: ${audioBlob.size} 字节`);
            
            // 如果音频数据为空，提示错误
            if (audioBlob.size === 0) {
              console.error('[语音录制] ❌ 警告: 录制的音频数据为空');
              if (onError) {
                onError('未录制到音频，请检查麦克风权限和环境');
              }
              return;
            }
            
            // 调用语音识别 API
            console.log('[语音录制] 开始调用语音识别API...');
            const result = await voiceApi.recognize(audioBlob);
            
            // 处理识别结果
            if (result.error) {
              console.log(`[语音录制] ❌ 识别失败: ${result.error}`);
              if (onError) {
                onError(result.error);
              }
            } else if (result.result) {
              console.log(`[语音录制] ✅ 识别成功，结果: "${result.result}"`);
              setRecognizedText(result.result);
              if (onResult) {
                onResult(result.result);
              }
            } else {
              console.log('[语音录制] ⚠️ 识别返回但无结果');
              if (onError) {
                onError('未识别到任何语音内容');
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '语音识别失败';
            console.error('[语音录制] ❌ 停止录音处理失败:', error);
            if (onError) {
              onError(errorMessage);
            }
          } finally {
            console.log('[语音录制] 清理录音资源');
            setIsRecording(false);
            audioChunksRef.current = [];
            mediaRecorderRef.current = null;
            resolve();
          }
      };

      // 停止录音
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    });
  }, [isRecording, onError, onResult]);

  const clearText = useCallback(() => {
    setRecognizedText('');
  }, []);

  return {
    isRecording,
      recognizedText,
      startRecording,
      stopRecording,
      clearText,
    };
};