import { defineConfig } from '@playwright/test'
import base from './playwright.config'

/** 真实联调专用前端代理到 8081 的独立测试库后端，不写入开发库。 */
export default defineConfig({
  ...base,
  testIgnore: [],
  outputDir: './test-results-api',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-api' }]],
  testMatch: '**/knowledge-api.spec.ts',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5174' },
  webServer: {
    command: 'npm run dev -- --port 5174',
    url: 'http://127.0.0.1:5174',
    env: { VITE_API_PROXY_TARGET: 'http://127.0.0.1:8081' },
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
