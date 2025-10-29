import Login from '../pages/Login'
import Register from '../pages/Register'
import Profile from '../pages/Profile'

interface RouteConfig {
  path: string
  component: React.ComponentType
  title?: string
}

const routes: RouteConfig[] = [
  {
    path: '/login',
    component: Login,
    title: '登录'
  },
  {
    path: '/register',
    component: Register,
    title: '注册'
  },
  {
    path: '/profile',
    component: Profile,
    title: '个人资料'
  },
  {
    path: '/',
    component: Login, // 暂时默认重定向到登录页
    title: '首页'
  }
]

export default routes