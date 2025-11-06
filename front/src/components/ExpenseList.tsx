import React from 'react';
import { Table, Button, Space, Typography, Tag, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Expense } from '../api/expenses';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ExpenseListProps {
  expenses: Expense[];
  totalAmount: number;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  onAdd: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  totalAmount,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const handleDelete = async (expenseId: string) => {
    try {
      await onDelete(expenseId);
      message.success('费用记录删除成功');
    } catch (error) {
      message.error('费用记录删除失败');
    }
  };

  const columns = [
    {
      title: '费用名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{category}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Expense) => (
        <Text strong>
          {record.currency || 'CNY'} {amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '日期',
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method?: string) => method || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Expense) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条费用记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 根据分类返回不同的标签颜色
  function getCategoryColor(category: string): string {
    const colorMap: { [key: string]: string } = {
      餐饮: 'green',
      交通: 'blue',
      住宿: 'orange',
      门票: 'purple',
      购物: 'cyan',
      娱乐: 'magenta',
      其他: 'default',
    };
    return colorMap[category] || 'default';
  }

  return (
    <div className="expense-list">
      <div className="flex justify-between items-center mb-4">
        <h2>费用记录</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          添加费用
        </Button>
      </div>
      
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <Text strong className="text-lg">总费用</Text>
          <Text strong className="text-xl text-red-600">
            CNY {totalAmount.toFixed(2)}
          </Text>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={expenses}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        locale={{
          emptyText: '暂无费用记录',
        }}
      />
    </div>
  );
};

export default ExpenseList;