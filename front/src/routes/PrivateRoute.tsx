import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const auth = useAuth();
  
  // 重要：在isLoading为true时不应重定向到登录页面
  // 这是修复刷新页面退回到登录页问题的关键
  if (auth.isLoading) {
    // 可以返回null或者一个加载指示器
    return null;
  }
  
  // 只有当用户未登录且加载完成时才重定向到登录页
  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};