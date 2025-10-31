-- 在Supabase中创建行程表
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  itinerary_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON itineraries(destination);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at);
CREATE INDEX IF NOT EXISTS idx_itineraries_start_end_date ON itineraries(start_date, end_date);

-- 启用行级安全性（RLS）以保护用户数据
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- 创建策略，确保用户只能访问自己的行程
CREATE POLICY "Users can only access their own itineraries" ON itineraries
  USING (user_id = auth.uid());

-- 创建策略，确保用户只能更新自己的行程
CREATE POLICY "Users can only update their own itineraries" ON itineraries
  FOR UPDATE USING (user_id = auth.uid());

-- 创建策略，确保用户只能删除自己的行程
CREATE POLICY "Users can only delete their own itineraries" ON itineraries
  FOR DELETE USING (user_id = auth.uid());

-- 创建策略，确保用户只能插入自己的行程
CREATE POLICY "Users can only insert their own itineraries" ON itineraries
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 创建一个函数来自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器，在更新时自动调用上述函数
CREATE TRIGGER update_itineraries_updated_at 
BEFORE UPDATE ON itineraries 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 可选：如果需要与auth.users表建立外键关系
ALTER TABLE itineraries
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;