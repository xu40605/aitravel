import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      // 这里将来会调用后端API进行登录验证
      console.log('登录信息:', values)
      
      // 模拟登录成功
      setTimeout(() => {
        message.success('登录成功')
        navigate('/dashboard') // 登录成功后跳转到首页
      }, 1000)
    } catch (error) {
      message.error('登录失败，请检查用户名和密码')
      console.error('登录错误:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <Title level={3}>AI Travel Planner</Title>
          <p className="text-gray-600">请登录您的账号</p>
        </div>
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
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
              登录
            </Button>
          </Form.Item>

          <div className="text-center mt-4">
            <span className="text-gray-600">还没有账号？</span>
            <a 
              href="/register" 
              className="text-primary ml-1 hover:underline"
            >
              立即注册
            </a>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login