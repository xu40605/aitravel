-- 在Supabase中创建费用记录表
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  expense_date DATE NOT NULL,
  payment_method VARCHAR(50),
  description TEXT,
  receipt_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_expenses_itinerary_id ON expenses(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);

-- 创建外键约束，将费用记录与行程关联
-- ALTER TABLE expenses
-- ADD CONSTRAINT fk_itinerary
-- FOREIGN KEY (itinerary_id)
-- REFERENCES itineraries(id)
-- ON DELETE CASCADE;

-- 创建外键约束，将费用记录与用户关联
-- ALTER TABLE expenses
-- ADD CONSTRAINT fk_expense_user
-- FOREIGN KEY (user_id)
-- REFERENCES auth.users(id)
-- ON DELETE CASCADE;

-- 使用已有的update_updated_at_column函数自动更新updated_at字段
CREATE TRIGGER update_expenses_updated_at 
BEFORE UPDATE ON expenses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 费用分类参考：餐饮、交通、住宿、门票、购物、娱乐、其他