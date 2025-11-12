import * as crypto from 'crypto-js';

interface RecognizeResult {
  result?: string;
  error?: string;
}

interface WsMessage {
  common?: {
    app_id: string;
  };
  business?: {
    language?: string;
    domain?: string;
    accent?: string;
    vad_eos?: number;
    dwa?: string;
  };
  data?: {
    status: number;
    format: string;
    encoding: string;
    sample_rate: number;
    text?: string;
    audio?: string;
  };
}

export class VoiceApiDirect {
  private appId: string;
  private apiKey: string;
  private apiSecret: string;
  private ws: WebSocket | null = null;
  private resultText: string = '';
  private isClosed: boolean = false;

  constructor() {
    this.appId = import.meta.env.VITE_XUNFEI_APP_ID || '';
    this.apiKey = import.meta.env.VITE_XUNFEI_API_KEY || '';
    this.apiSecret = import.meta.env.VITE_XUNFEI_API_SECRET || '';

    // 验证配置
    if (!this.appId || !this.apiKey || !this.apiSecret) {
      console.warn('语音识别配置不完整，可能会导致功能不可用');
    }
  }

  // 构建WebSocket连接URL
  private buildWsUrl(): string {
    const host = 'iat-api.xfyun.cn';
    const apiKey = this.apiKey;
    const apiSecret = this.apiSecret;
    const date = new Date().toUTCString();
    const algorithm = 'hmac-sha256';
    const headers = 'host date request-line';
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;
    
    // 计算签名
    const signature = crypto.HmacSHA256(signatureOrigin, apiSecret).toString(crypto.enc.Base64);
    const authorizationOrigin = `${algorithm} api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    
    return `wss://${host}/v2/iat?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  }

  // 将音频数据转换为Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // 将Blob转换为ArrayBuffer
  private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  // 音频格式转换（简化版，实际可能需要更复杂的处理）
  private async convertToPCM(audioBlob: Blob): Promise<ArrayBuffer> {
    // 这里简化处理，实际项目中可能需要使用Web Audio API进行更复杂的格式转换
    // 或者使用如ffmpeg.wasm这样的库进行格式处理
    return this.blobToArrayBuffer(audioBlob);
  }

  // 发送音频数据到WebSocket
  private sendAudioData(ws: WebSocket, audioData: ArrayBuffer, index: number, chunks: number): void {
    const frame: WsMessage = {
      data: {
        status: index === chunks - 1 ? 2 : 1,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        sample_rate: 16000,
        audio: this.arrayBufferToBase64(audioData)
      }
    };
    ws.send(JSON.stringify(frame));
  }

  // 直接在前端进行语音识别
  async recognize(audioData: Blob | ArrayBuffer): Promise<RecognizeResult> {
    try {
      console.log('[前端语音识别] 开始处理语音输入');
      
      // 验证配置
      if (!this.appId || !this.apiKey || !this.apiSecret) {
        return { error: '科大讯飞API配置不完整' };
      }

      // 确保数据是ArrayBuffer格式
      let audioBuffer: ArrayBuffer;
      if (audioData instanceof Blob) {
        audioBuffer = await this.blobToArrayBuffer(audioData);
      } else {
        audioBuffer = audioData;
      }

      console.log(`[前端语音识别] 音频数据大小: ${audioBuffer.byteLength} 字节`);

      // 分段发送音频数据（每段1024字节）
      const chunkSize = 1024;
      const chunks = Math.ceil(audioBuffer.byteLength / chunkSize);
      
      return new Promise((resolve) => {
        try {
          // 构建WebSocket URL并连接
          const wsUrl = this.buildWsUrl();
          console.log(`[前端语音识别] 连接WebSocket: ${wsUrl}`);
          
          this.ws = new WebSocket(wsUrl);
          this.resultText = '';
          this.isClosed = false;

          // 初始化消息
          const initMessage: WsMessage = {
            common: { app_id: this.appId },
            business: {
              language: 'zh_cn',
              domain: 'iat',
              accent: 'mandarin',
              vad_eos: 10000,
              dwa: 'wpgs'
            },
            data: {
              status: 0,
              format: 'audio/L16;rate=16000',
              encoding: 'raw',
              sample_rate: 16000
            }
          };

          this.ws.onopen = () => {
            console.log('[前端语音识别] WebSocket连接已建立');
            this.ws?.send(JSON.stringify(initMessage));
            
            // 分段发送音频数据
            for (let i = 0; i < chunks; i++) {
              const start = i * chunkSize;
              const end = Math.min(start + chunkSize, audioBuffer.byteLength);
              const chunk = audioBuffer.slice(start, end);
              
              // 延迟发送以避免网络拥塞
              setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isClosed) {
                  this.sendAudioData(this.ws, chunk, i, chunks);
                }
              }, i * 40); // 每40ms发送一段
            }
          };

          this.ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('[前端语音识别] 接收消息:', data);
              
              // 处理识别结果
              if (data.data && data.data.text) {
                this.resultText += data.data.text;
              }
              
              // 检查是否识别结束
              if (data.code === 0 && data.data && data.data.status === 2) {
                console.log('[前端语音识别] 识别完成');
                this.isClosed = true;
                this.ws?.close();
                resolve({ result: this.resultText });
              }
            } catch (error) {
              console.error('[前端语音识别] 处理消息失败:', error);
            }
          };

          this.ws.onerror = (error) => {
            console.error('[前端语音识别] WebSocket错误:', error);
            this.isClosed = true;
            resolve({ error: 'WebSocket连接错误' });
          };

          this.ws.onclose = () => {
            console.log('[前端语音识别] WebSocket连接已关闭');
            if (!this.isClosed) {
              this.isClosed = true;
              // 如果已经有识别结果，返回结果，否则返回错误
              if (this.resultText) {
                resolve({ result: this.resultText });
              } else {
                resolve({ error: 'WebSocket连接意外关闭' });
              }
            }
          };
        } catch (error) {
          console.error('[前端语音识别] 初始化失败:', error);
          resolve({ error: '语音识别初始化失败' });
        }
      });
    } catch (error) {
      console.error('[前端语音识别] 识别失败:', error);
      return { error: error instanceof Error ? error.message : '语音识别失败' };
    } finally {
      // 清理WebSocket连接
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  }
}

// 创建并导出VoiceApiDirect的单例实例
export const voiceApiDirect = new VoiceApiDirect();