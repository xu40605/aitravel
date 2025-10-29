import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 加载环境变量
config({
  path: path.resolve(__dirname, '../../.env')
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

async function initDatabase() {
  try {
    console.log('开始执行数据库初始化...');
    
    // 读取SQL文件
    const sqlFilePath = path.resolve(__dirname, '../sql/init_users.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('SQL内容已读取，准备执行...');
    
    // 注意：在实际环境中，你需要在Supabase Dashboard中手动执行这个SQL语句
    // 或者设置一个Postgres函数来执行SQL
    
    console.log('请在Supabase Dashboard中执行以下SQL语句来创建users表:');
    console.log('----------------------------------------');
    console.log(sqlContent);
    console.log('----------------------------------------');
    
    // 尝试执行一个简单的查询来测试连接
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });
    
    if (response.ok) {
      console.log('表已存在或连接成功！');
    } else {
      const errorData = await response.json();
      console.log('表可能不存在:', errorData);
      console.log('请按照上面的提示在Supabase Dashboard中手动执行SQL语句。');
    }
    
    console.log('数据库初始化检查完成！');
    process.exit(0);
  } catch (error) {
    console.error('执行初始化脚本时出错:', error);
    process.exit(1);
  }
}

initDatabase();