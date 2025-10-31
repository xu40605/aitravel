import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      // 将所有/api请求代理到后端服务
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
        // 移除rewrite规则，因为后端路由已经包含/api前缀
      }
    }
  }
})