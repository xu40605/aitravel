import React from 'react';
import { Card, Row, Col, Typography, Statistic } from 'antd';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Expense } from '../api/expenses';

const { Title, Text } = Typography;

interface ExpenseChartProps {
  expenses: Expense[];
  totalAmount: number;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses = [], totalAmount }) => {
  // 按分类统计费用
  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();
    
    if (Array.isArray(expenses)) {
      expenses.forEach(expense => {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
      });
    }
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      percent: totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : '0',
    }));
  };

  // 按日期统计费用（最近7天）
  const getDateData = () => {
    const dateMap = new Map<string, number>();
    const today = new Date();
    
    // 初始化最近7天的数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }
    
    // 统计费用，确保expenses是数组
    if (Array.isArray(expenses)) {
      expenses.forEach(expense => {
        if (expense && dateMap.has(expense.expense_date)) {
          const current = dateMap.get(expense.expense_date) || 0;
          dateMap.set(expense.expense_date, current + expense.amount);
        }
      });
    }
    
    return Array.from(dateMap.entries()).map(([date, amount]) => ({
      date: formatDate(date),
      amount,
    }));
  };

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 饼图颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  const categoryData = getCategoryData();
  const dateData = getDateData();

  // 饼图自定义标签
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} ${percent}%`}
      </text>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Title level={4}>费用统计概览</Title>
      </Col>
      
      {/* 总费用统计卡片 */}
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic 
            title="总费用" 
            value={totalAmount} 
            precision={2}
            prefix="¥"
            suffix="元"
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic 
            title="费用笔数" 
            value={expenses.length}
            suffix="笔"
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic 
            title="平均每笔" 
            value={expenses.length > 0 ? totalAmount / expenses.length : 0} 
            precision={2}
            prefix="¥"
            suffix="元"
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>

      {/* 饼图 - 费用分类占比 */}
      <Col xs={24} lg={12}>
        <Card title="费用分类占比">
          {categoryData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <Text type="secondary">暂无费用数据</Text>
            </div>
          )}
        </Card>
      </Col>

      {/* 柱状图 - 最近7天费用趋势 */}
      <Col xs={24} lg={12}>
        <Card title="最近7天费用趋势">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dateData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                <Bar dataKey="amount" fill="#8884d8" name="费用金额" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default ExpenseChart;