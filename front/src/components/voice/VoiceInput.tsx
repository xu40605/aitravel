import React, { useState } from 'react';
import { Button, Typography, Alert, Space } from 'antd';
import { AudioOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import { useVoiceRecognition } from './useVoiceRecognition';

const { Text } = Typography;

interface VoiceInputProps {
  onTextChange?: (text: string) => void;
  placeholder?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTextChange,
  placeholder = '按住说话，松开结束',
}) => {
  const [error, setError] = useState<string | null>(null);

  const {
    isRecording,
    recognizedText,
    startRecording,
    stopRecording,
    clearText,
  } = useVoiceRecognition({
    onResult: (text) => {
      if (onTextChange) {
        onTextChange(text);
      }
    },
    onError: (errorMessage) => {
      setError(errorMessage);
      // 3秒后自动清除错误提示
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleMouseDown = () => {
    setError(null);
    startRecording();
  };

  const handleMouseUp = () => {
    stopRecording();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // 防止触发鼠标事件
    setError(null);
    startRecording();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // 防止触发鼠标事件
    stopRecording();
  };

  const handleClear = () => {
    clearText();
    if (onTextChange) {
      onTextChange('');
    }
  };

  return (
    <div className="voice-input-container">
      <Space direction="vertical" style={{ width: '100%' }}>
        {error && (
          <Alert
            message="语音输入错误"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}
        
        <div className="voice-text-display" style={{
          padding: '12px',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          minHeight: '40px',
          marginBottom: '12px',
        }}>
          {recognizedText || (
            <Text type="secondary">{placeholder}</Text>
          )}
        </div>
        
        <div className="voice-controls" style={{ display: 'flex', gap: '8px' }}>
          <Button
            type={isRecording ? 'primary' : 'default'}
            icon={isRecording ? <StopOutlined /> : <AudioOutlined />}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            disabled={isRecording}
            style={{
              minWidth: '120px',
              backgroundColor: isRecording ? '#ff4d4f' : undefined,
              borderColor: isRecording ? '#ff4d4f' : undefined,
            }}
          >
            {isRecording ? '正在录音...' : '按住说话'}
          </Button>
          
          {recognizedText && (
            <Button
              icon={<DeleteOutlined />}
              onClick={handleClear}
              style={{ minWidth: '100px' }}
            >
              清除文本
            </Button>
          )}
        </div>
      </Space>
    </div>
  );
};