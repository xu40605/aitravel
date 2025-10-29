import { Layout, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Header } = Layout
const { Title } = Typography

const AppHeader = () => {
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <Header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div 
          className="flex items-center cursor-pointer"
          onClick={handleLogoClick}
        >
          <Title level={4} className="text-white m-0">
            AI Travel Planner
          </Title>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {/* 这里将来会根据用户登录状态显示不同的导航项 */}
        </div>
      </div>
    </Header>
  )
}

export default AppHeader