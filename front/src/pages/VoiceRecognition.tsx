import React, { useState } from 'react';
import { Layout, Typography, Card, Space } from 'antd';
import { VoiceInput } from '@/components/voice/VoiceInput';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

const VoiceRecognition: React.FC = () => {
  const [recognizedText, setRecognizedText] = useState('');

  const handleTextChange = (text: string) => {
    setRecognizedText(text);
  };

  return (
    <Layout className="min-h-screen">
      <Header style={{ background: '#fff', padding: 0 }}>
        <Title level={3} style={{ margin: '16px 24px', color: '#1890ff' }}>
          AI Travel Planner - 语音识别功能
        </Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
          <Title level={4}>语音输入演示</Title>
          <Paragraph>按住下面的按钮说话，松开后将自动识别您的语音并显示结果。</Paragraph>
          
          <Space direction="vertical" style={{ width: '100%', marginTop: '24px' }}>
            <VoiceInput 
              onTextChange={handleTextChange}
              placeholder="请按住按钮开始说话..."
            />
            
            {recognizedText && (
              <Card title="识别结果" style={{ marginTop: '16px' }}>
                <Paragraph>{recognizedText}</Paragraph>
              </Card>
            )}
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default VoiceRecognition;