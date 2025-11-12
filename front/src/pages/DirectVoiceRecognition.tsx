import React, { useState } from 'react';
import { Layout, Typography, Card, Space, Switch, Row, Col } from 'antd';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { SettingOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const DirectVoiceRecognition: React.FC = () => {
  const [recognizedText, setRecognizedText] = useState('');
  const [useDirect, setUseDirect] = useState(true); // 默认使用前端直接识别
  const [recognitionMethod, setRecognitionMethod] = useState('前端直接识别');

  const handleTextChange = (text: string) => {
    setRecognizedText(text);
  };

  const handleModeChange = (checked: boolean) => {
    setUseDirect(checked);
    setRecognitionMethod(checked ? '前端直接识别' : '后端识别');
    setRecognizedText(''); // 切换模式时清空之前的识别结果
  };

  return (
    <Layout className="min-h-screen">
      <Header style={{ background: '#fff', padding: 0 }}>
        <Title level={3} style={{ margin: '16px 24px', color: '#1890ff' }}>
          AI Travel Planner - 语音识别演示
        </Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
          <Title level={4}>语音输入演示</Title>
          <Paragraph>按住下面的按钮说话，松开后将自动识别您的语音并显示结果。</Paragraph>
          
          {/* 识别模式切换 */}
          <Row 
            align="middle" 
            style={{ marginBottom: '24px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}
          >
            <Col flex="auto">
              <Space align="center">
                <SettingOutlined />
                <Text strong>语音识别模式：</Text>
                <Text>{recognitionMethod}</Text>
              </Space>
            </Col>
            <Col>
              <Switch 
                checked={useDirect} 
                onChange={handleModeChange}
                checkedChildren="前端"
                unCheckedChildren="后端"
              />
            </Col>
          </Row>

          {/* 语音输入区域 */}
          <Space direction="vertical" style={{ width: '100%' }}>
            <VoiceInput 
              onTextChange={handleTextChange}
              placeholder="请按住按钮开始说话..."
              useDirect={useDirect}
            />
            
            {recognizedText && (
              <Card title="识别结果" style={{ marginTop: '16px' }}>
                <Paragraph>{recognizedText}</Paragraph>
              </Card>
            )}
          </Space>

          {/* 模式说明 */}
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
            <Title level={5}>模式说明</Title>
            <Paragraph>
              <Text strong>前端直接识别：</Text> 
              音频数据在本地处理后直接发送到科大讯飞API，无需经过后端服务器中转，响应速度更快，隐私保护更好。
            </Paragraph>
            <Paragraph>
              <Text strong>后端识别：</Text> 
              音频数据发送到后端服务器，由后端处理并调用语音识别服务，适合网络环境不稳定或需要额外处理的场景。
            </Paragraph>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default DirectVoiceRecognition;