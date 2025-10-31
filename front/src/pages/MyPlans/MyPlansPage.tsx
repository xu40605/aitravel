import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const MyPlansPage: React.FC = () => {
  return (
    <div>
      <Card
        title={<Title level={2}>我的旅行计划</Title>}
        style={{ width: '100%' }}
      >
        <Paragraph>这里是我的旅行计划页面</Paragraph>
        <Paragraph>您可以在这里查看和管理您的所有旅行计划。</Paragraph>
      </Card>
    </div>
  );
};

export default MyPlansPage;