import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api requests to our FastAPI backend
      '/api': {
        target: 'http://localhost:8000', // Assuming backend runs on port 8000
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Uncomment if backend paths don't start with /api
      },
    },
  },
})
