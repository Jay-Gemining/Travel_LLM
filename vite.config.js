import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置文档: https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 将 /api 开头的请求代理到 FastAPI 后端
      '/api': {
        target: 'http://localhost:8000', // 假设后端运行在 8000 端口
        changeOrigin: true, // 需要虚拟主机站点
        // rewrite: (path) => path.replace(/^\/api/, ''), // 如果后端路径本身不以 /api 开头，则取消此行注释进行路径重写
      },
    },
  },
})
