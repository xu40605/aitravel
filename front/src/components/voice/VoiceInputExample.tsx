import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { VoiceInput } from './VoiceInput';

const { Title, Text } = Typography;

// 这个示例展示了如何在登录页面中集成语音输入功能
export const VoiceInputLoginExample: React.FC = () => {
  const [form] = Form.useForm();
  const [voiceCommand, setVoiceCommand] = useState('');

  const handleLogin = async (values: { username: string; password: string }) => {
    console.log('登录信息:', values);
    // 这里可以调用登录API
  };

  const handleVoiceCommand = (text: string) => {
    setVoiceCommand(text);
    
    // 简单的语音命令解析示例
    // 例如："用户名张三 密码123456"
    const usernameMatch = text.match(/用户名([^，,\s]+)/);
    const passwordMatch = text.match(/密码([^，,\s]+)/);
    
    if (usernameMatch && usernameMatch[1]) {
      form.setFieldValue('username', usernameMatch[1]);
    }
    
    if (passwordMatch && passwordMatch[1]) {
      form.setFieldValue('password', passwordMatch[1]);
    }
  };

  return (
    <Card style={{ maxWidth: 400, margin: '0 auto' }}>
      <Title level={4} style={{ textAlign: 'center' }}>语音辅助登录</Title>
      
      <Form
        form={form}
        name="login"
        onFinish={handleLogin}
        layout="vertical"
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
        </Form.Item>

        <div style={{ margin: '16px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
            语音输入示例："用户名张三 密码123456"
          </Text>
          <VoiceInput 
            onTextChange={handleVoiceCommand}
            placeholder="按住按钮说话，尝试说登录命令"
          />
          {voiceCommand && (
            <Text type="success" style={{ display: 'block', marginTop: '8px' }}>
              识别结果: {voiceCommand}
            </Text>
          )}
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

// 使用说明：
// 1. 将此组件导入到你的登录页面中
// 2. 替换现有的登录表单，或添加到适当位置
// 3. 确保已经配置了科大讯飞的环境变量
// 4. 使用示例：
//    ```tsx
//    import { VoiceInputLoginExample } from '@/components/voice/VoiceInputExample';
//    
//    const LoginPage = () => {
//      return (
//        <div className="login-page">
//          <VoiceInputLoginExample />
//        </div>
//      );
//    };
//    ```