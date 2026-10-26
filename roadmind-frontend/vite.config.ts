import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// 真实知识库通过 /api 代理访问后端；独立演示模式不发起业务请求。
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      host: '127.0.0.1', port: 5173, strictPort: true,
      proxy: { '/api': { target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true } },
    },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  }
})
