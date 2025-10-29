import Login from '../pages/Login'
import Register from '../pages/Register'

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
    path: '/',
    component: Login, // 暂时默认重定向到登录页
    title: '首页'
  }
]

export default routes