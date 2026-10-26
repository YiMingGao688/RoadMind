import { defineConfig } from '@playwright/test'

/** Windows 使用已安装的 Edge；其他环境使用 Playwright Chromium。 */
export default defineConfig({
  testDir: './tests',
  testIgnore: '**/knowledge-api.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 1000 },
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
