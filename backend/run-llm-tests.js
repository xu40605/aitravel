#!/usr/bin/env node

// 运行LLM测试的脚本
const { execSync } = require('child_process');
const path = require('path');

console.log('启动LLM行程生成测试...');

try {
  // 检查是否安装了ts-node
  try {
    execSync('npx ts-node --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('未检测到ts-node，尝试使用node和tsc...');
    
    // 尝试编译并运行
    try {
      // 先编译TypeScript
      console.log('正在编译TypeScript文件...');
      execSync('npx tsc', { stdio: 'inherit' });
      
      // 运行编译后的测试文件
      console.log('运行编译后的测试文件...');
      execSync('node dist/tests/llm.test.js', { stdio: 'inherit' });
    } catch (compileError) {
      console.error('编译失败，请先安装依赖并确保TypeScript配置正确。');
      console.error('建议运行: npm install ts-node typescript --save-dev');
      process.exit(1);
    }
    
    return;
  }

  // 使用ts-node直接运行测试
  console.log('使用ts-node运行测试...');
  execSync('npx ts-node src/tests/llm.test.ts', { stdio: 'inherit' });
  
} catch (error) {
  console.error('测试执行失败:', error.message);
  process.exit(1);
}