import React, { useState } from 'react';
import { Card, Typography, Form, Input, Button, Upload, message, Avatar, Spin } from 'antd';
import { UserOutlined, CameraOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import type { UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar_url);

  // 初始化表单数据
  React.useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name || '',
        email: user.email,
      });
      setAvatarUrl(user.avatar_url);
    }
  }, [user, form]);

  // 头像上传前的校验
  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 图片!');
      return Upload.LIST_IGNORE;
    }
    const isLessThan2M = file.size / 1024 / 1024 < 2;
    if (!isLessThan2M) {
      message.error('图片大小必须小于 2MB!');
      return Upload.LIST_IGNORE;
    }
    
    // 模拟上传，实际项目中应该上传到服务器
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    
    return false; // 阻止自动上传
  };

  const uploadProps: UploadProps = {
    beforeUpload,
    showUploadList: false,
    name: 'avatar',
  };

  // 保存个人资料
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const updateData = {
        name: values.name,
        avatar_url: avatarUrl,
      };

      await updateProfile(updateData);
      message.success('个人资料更新成功');
      setIsEditing(false);
    } catch (error: any) {
      message.error(error.message || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false);
    setAvatarUrl(user?.avatar_url);
    form.resetFields();
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 0' }}>
      <Card title={<Title level={2}>个人资料</Title>} style={{ width: '100%' }}>
        {/* 头像部分 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <Upload {...uploadProps} disabled={!isEditing}>
            <div style={{ position: 'relative', cursor: isEditing ? 'pointer' : 'default' }}>
              <Avatar 
                size={120} 
                icon={user?.avatar_url ? undefined : <UserOutlined />} 
                src={user?.avatar_url} 
              />
              {isEditing && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#1890ff',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CameraOutlined />
                </div>
              )}
            </div>
          </Upload>
          <Text style={{ marginTop: '10px', fontSize: '16px', fontWeight: 'bold' }}>
            {user?.name || '未设置昵称'}
          </Text>
        </div>

        {/* 用户信息表单 */}
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[{ required: true, message: '请输入邮箱地址' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input disabled={!isEditing} placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            name="name"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }, { min: 2, max: 20, message: '昵称长度应在2-20个字符之间' }]}
          >
            <Input disabled={!isEditing} placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item label="注册时间">
            <Text type="secondary">
              {user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '未知'}
            </Text>
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {!isEditing ? (
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={() => setIsEditing(true)}
                >
                  编辑资料
                </Button>
              ) : (
                <>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSave}
                    loading={loading}
                  >
                    保存
                  </Button>
                  <Button onClick={handleCancel}>
                    取消
                  </Button>
                </>
              )}
            </div>
          </Form.Item>
        </Form>
      </Card>

      {/* 使用提示 */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          提示：您可以在此页面更新您的基本个人信息，包括头像和昵称。
        </Text>
      </div>
    </div>
  );
};

export default ProfilePage;