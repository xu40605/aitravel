import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const ProfilePage: React.FC = () => {
  return (
    <div>
      <Card
        title={<Title level={2}>个人资料</Title>}
        style={{ width: '100%' }}
      >
        <Paragraph>这里是个人资料页面</Paragraph>
        <Paragraph>您可以在这里查看和编辑您的个人信息。</Paragraph>
      </Card>
    </div>
  );
};

export default ProfilePage;