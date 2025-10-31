import React from 'react';
import { Layout, Menu, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { MenuProps } from 'antd';
import 'antd/dist/reset.css';

const { Header, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuProps['items'] = [
    { key: '/planner', label: '旅行计划生成' },
    { key: '/my-plans', label: '我的旅行计划' },
    { key: '/profile', label: '个人资料' },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key as string);
  };

  return (
    <Layout className="min-h-screen">
      <Header style={{ backgroundColor: 'white', padding: 0, height: 64, borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%', padding: '0 24px' }}>
          <Menu
            mode="horizontal"
            items={menuItems}
            selectedKeys={[
              menuItems.find((item) => location.pathname.startsWith(item?.key as string))?.key?.toString() || '',
            ]}
            onClick={handleMenuClick}
            theme="light"
            style={{ backgroundColor: 'white', borderBottom: 'none', flex: 1 }}
          />
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/profile')} />
        </div>
      </Header>
      <Content className="p-8 bg-gray-50">
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout;
