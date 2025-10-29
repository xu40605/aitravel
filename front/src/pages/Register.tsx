import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, MobileOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography

const Register = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (values: {
    username: string
    password: string
    confirmPassword: string
    phone: string
  }) => {
    setLoading(true)
    try {
      // 验证密码是否一致
      if (values.password !== values.confirmPassword) {
        message.error('两次输入的密码不一致')
        return
      }

      // 这里将来会调用后端API进行注册
      console.log('注册信息:', values)

      // 模拟注册成功
      setTimeout(() => {
        message.success('注册成功，请登录')
        navigate('/login')
      }, 1000)
    } catch (error) {
      message.error('注册失败，请稍后重试')
      console.error('注册错误:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <Title level={3}>AI Travel Planner</Title>
          <p className="text-gray-600">创建您的账号</p>
        </div>

        <Form
          name="register"
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少需要3个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
            ]}
          >
            <Input
              prefix={<MobileOutlined className="text-gray-400" />}
              placeholder="请输入手机号"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少需要6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请再次输入密码"
            />
          </Form.Item>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              loading={loading}
              size="large"
            >
              注册
            </Button>
          </Form.Item>

          <div className="text-center mt-4">
            <span className="text-gray-600">已有账号？</span>
            <a 
              href="/login" 
              className="text-primary ml-1 hover:underline"
            >
              立即登录
            </a>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register