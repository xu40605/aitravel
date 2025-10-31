import React, { useState, useEffect } from 'react';
import { Spin, message, Empty } from 'antd';
import { useParams } from 'react-router-dom';
import ExpenseList from '../components/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseChart from '../components/ExpenseChart';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  type Expense,
  type ExpenseRequest,
} from '../api/expenses';

const ExpenseManagement: React.FC = () => {
  const { itineraryId } = useParams<{ itineraryId: string }>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

  // 加载指定行程的费用记录
  const loadExpenses = async () => {
    if (!itineraryId) {
      console.log('未找到行程ID，无法加载费用记录');
      return;
    }
    
    try {
      console.log(`开始加载行程ID: ${itineraryId} 的费用记录`);
      setLoading(true);
      const response = await getExpenses(itineraryId);
      console.log('获取费用记录的响应:', response);
      
      // 确保获取到正确的expenses数组
      const expenseList = response.success && Array.isArray(response.data) ? response.data : [];
      console.log(`获取到 ${expenseList.length} 条费用记录`);
      console.log('费用记录详情:', expenseList);
      setExpenses(expenseList);
      
      // 计算总费用
      const total = expenseList.reduce((sum, expense) => sum + expense.amount, 0);
      console.log(`总费用: ${total}`);
      setTotalAmount(total);
    } catch (error) {
      console.error('加载费用记录失败:', error);
      message.error('加载费用记录失败，请重试');
    } finally {
      setLoading(false);
      console.log('费用记录加载完成');
    }
  };

  // 初始加载
  useEffect(() => {
    loadExpenses();
  }, [itineraryId]);

  // 添加费用记录
  const handleAddExpense = async (expenseData: ExpenseRequest) => {
    if (!itineraryId) return;
    
    try {
      await addExpense(itineraryId, expenseData);
      await loadExpenses(); // 重新加载数据
      setShowForm(false); // 关闭表单
      message.success('费用记录添加成功');
    } catch (error) {
      console.error('添加费用记录失败:', error);
      message.error('添加费用记录失败，请重试');
      throw error;
    }
  };

  // 更新费用记录
  const handleUpdateExpense = async (expenseData: ExpenseRequest) => {
    if (!editingExpense) return;
    
    try {
      await updateExpense(editingExpense.id, expenseData);
      await loadExpenses(); // 重新加载数据
      setShowForm(false); // 关闭表单
      setEditingExpense(undefined); // 清空编辑状态
      message.success('费用记录更新成功');
    } catch (error) {
      console.error('更新费用记录失败:', error);
      message.error('更新费用记录失败，请重试');
      throw error;
    }
  };

  // 删除费用记录
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      await loadExpenses(); // 重新加载数据
    } catch (error) {
      console.error('删除费用记录失败:', error);
      throw error;
    }
  };

  // 打开编辑表单
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  // 打开添加表单
  const handleAdd = () => {
    setEditingExpense(undefined);
    setShowForm(true);
  };

  // 关闭表单
  const handleCancel = () => {
    setShowForm(false);
    setEditingExpense(undefined);
  };

  // 处理表单提交
  const handleSubmit = async (expenseData: ExpenseRequest) => {
    if (editingExpense) {
      await handleUpdateExpense(expenseData);
    } else {
      await handleAddExpense(expenseData);
    }
  };

  if (!itineraryId) {
    return (
      <div className="expense-management">
        <Empty description="请选择一个旅行计划" />
      </div>
    );
  }

return (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="expense-management max-w-4xl mx-auto px-8 sm:px-12">
      <Spin spinning={loading} tip="加载中...">
        <ExpenseChart expenses={expenses} totalAmount={totalAmount} />
        <div className="mt-8">
          <ExpenseList
            expenses={expenses}
            totalAmount={totalAmount}
            onEdit={handleEdit}
            onDelete={handleDeleteExpense}
            onAdd={handleAdd}
          />
        </div>
      </Spin>

      <ExpenseForm
        visible={showForm}
        expense={editingExpense}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  </div>
);
};

export default ExpenseManagement;