import { createContext, useState, useContext, ReactNode } from 'react'

interface User {
  id: string
  username: string
  phone: string
  // 其他用户信息
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  // TODO: 实现完整的认证逻辑
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const login = async (username: string, password: string) => {
    // TODO: 实现登录逻辑，调用API并处理响应
    console.log('Login attempt:', username)
    // 暂时使用模拟数据
    setUser({ id: '1', username, phone: '' })
  }

  const register = async (userData: any) => {
    // TODO: 实现注册逻辑，调用API并处理响应
    console.log('Register attempt:', userData)
  }

  const logout = () => {
    // TODO: 实现登出逻辑，清除token等
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}