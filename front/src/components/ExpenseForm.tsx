import React from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Modal, message } from 'antd';
import type { Expense, ExpenseRequest } from '../api/expenses';
import { expenseCategories, paymentMethods } from '../api/expenses';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface ExpenseFormProps {
  visible: boolean;
  expense?: Expense;
  onCancel: () => void;
  onSubmit: (expense: ExpenseRequest) => Promise<void>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  visible,
  expense,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!expense;

  // 重置表单
  const resetForm = () => {
    form.resetFields();
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const expenseData: ExpenseRequest = {
        ...values,
        expense_date: values.expense_date.format('YYYY-MM-DD'),
      };
      await onSubmit(expenseData);
      message.success(isEdit ? '费用记录更新成功' : '费用记录添加成功');
      resetForm();
      onCancel();
    } catch (error) {
      console.error('表单提交失败:', error);
      message.error('操作失败，请重试');
    }
  };

  // 处理模态框显示变化
  React.useEffect(() => {
    if (visible) {
      if (isEdit && expense) {
        // 编辑模式，填充表单
        form.setFieldsValue({
          ...expense,
          expense_date: dayjs(expense.expense_date),
        });
      } else {
        // 添加模式，设置默认日期为今天
        form.setFieldsValue({
          currency: 'CNY',
          expense_date: dayjs(),
        });
      }
    } else {
      // 模态框关闭时重置表单
      resetForm();
    }
  }, [visible, isEdit, expense, form]);

  return (
    <Modal
      title={isEdit ? '编辑费用记录' : '添加费用记录'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="确认"
      cancelText="取消"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          label="费用名称"
          name="name"
          rules={[{ required: true, message: '请输入费用名称' }]}
        >
          <Input placeholder="请输入费用名称" />
        </Form.Item>

        <Form.Item
          label="费用分类"
          name="category"
          rules={[{ required: true, message: '请选择费用分类' }]}
        >
          <Select placeholder="请选择费用分类">
            {expenseCategories.map((category) => (
              <Option key={category.value} value={category.value}>
                {category.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="金额"
          name="amount"
          rules={[
            { required: true, message: '请输入费用金额' },
            { type: 'number', min: 0.01, message: '金额必须大于0' },
          ]}
        >
          <InputNumber
            className="w-full"
            placeholder="请输入费用金额"
            precision={2}
            min={0.01}
            step={0.01}
          />
        </Form.Item>

        <Form.Item
          label="货币"
          name="currency"
          rules={[{ required: true, message: '请选择货币类型' }]}
        >
          <Select placeholder="请选择货币类型">
            <Option value="CNY">CNY - 人民币</Option>
            <Option value="USD">USD - 美元</Option>
            <Option value="EUR">EUR - 欧元</Option>
            <Option value="JPY">JPY - 日元</Option>
            <Option value="KRW">KRW - 韩元</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="日期"
          name="expense_date"
          rules={[{ required: true, message: '请选择费用日期' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>

        <Form.Item
          label="支付方式"
          name="payment_method"
        >
          <Select placeholder="请选择支付方式" allowClear>
            {paymentMethods.map((method) => (
              <Option key={method.value} value={method.value}>
                {method.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="备注"
          name="description"
        >
          <TextArea rows={3} placeholder="请输入备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExpenseForm;