import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function buildStamp() {
  return new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' })
    .slice(0, 16)
}

export default defineConfig({
  base: '/cruise-management/',
  plugins: [react()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildStamp()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
