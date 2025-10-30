import React, { useState } from 'react';
import { Card, Typography, Form, Input, Button, Avatar, message, Spin, List } from 'antd';
import { UserOutlined, MailOutlined, AudioOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/index.css';

const { Title, Paragraph, Text } = Typography;

const Profile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const { user, logout, updateProfile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name || '',
        email: user.email,
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user, form]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleUpdate = async (values: { name: string; avatar_url?: string }) => {
    setLoading(true);
    try {
      await updateProfile(values);
      message.success('资料更新成功');
      setEditing(false);
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleVoiceRecognition = () => {
    navigate('/voice-recognition');
  };

  return (
    <div className="flex justify-center p-6 bg-gray-50 min-h-screen">
      <div className="w-full max-w-2xl">
        <Card className="w-full mb-6">
          <Title level={2} className="text-center mb-6">个人资料</Title>
          
          <div className="flex justify-center mb-6">
            <Avatar
              size={128}
              src={user.avatar_url}
              icon={<UserOutlined />}
              className="border-4 border-gray-200"
            />
          </div>

          {editing ? (
            <Form
              form={form}
              onFinish={handleUpdate}
              layout="vertical"
            >
              <Form.Item
                name="name"
                label="昵称"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
              >
                <Input prefix={<MailOutlined className="site-form-item-icon" />} disabled />
              </Form.Item>

              <Form.Item
                name="avatar_url"
                label="头像URL"
              >
                <Input placeholder="请输入头像URL（可选）" />
              </Form.Item>

              <Form.Item>
                <div className="flex gap-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="flex-1"
                    loading={loading}
                  >
                    保存
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false);
                      form.setFieldsValue({
                        name: user.name || '',
                        email: user.email,
                        avatar_url: user.avatar_url || ''
                      });
                    }}
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </Form.Item>
            </Form>
          ) : (
            <div>
              <div className="mb-6">
                <Text strong className="text-gray-600 block mb-2">昵称：</Text>
                <Paragraph className="text-xl">{user.name || '未设置'}</Paragraph>
              </div>

              <div className="mb-6">
                <Text strong className="text-gray-600 block mb-2">邮箱：</Text>
                <Paragraph className="text-xl">{user.email}</Paragraph>
              </div>

              <div className="mb-6">
                <Text strong className="text-gray-600 block mb-2">注册时间：</Text>
                <Paragraph>
                  {new Date(user.created_at).toLocaleString('zh-CN')}
                </Paragraph>
              </div>

              <div className="flex gap-4">
                <Button
                  type="primary"
                  className="flex-1"
                  onClick={() => setEditing(true)}
                >
                  编辑资料
                </Button>
                <Button
                  danger
                  className="flex-1"
                  onClick={handleLogout}
                >
                  退出登录
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card title="功能导航">
          <List
            dataSource={[
              {
                title: '语音识别功能',
                description: '使用语音输入进行行程规划',
                icon: <AudioOutlined />,
                onClick: handleVoiceRecognition
              }
            ]}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    icon={item.icon}
                    onClick={item.onClick}
                  >
                    进入
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
};

export default Profile;