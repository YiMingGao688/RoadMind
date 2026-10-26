import { expect, test, type APIRequestContext } from '@playwright/test'

type RecordData = { id: string; name: string; description: string; category: string; documentCount: number }
let ids: string[] = []
let runtimeErrors: string[] = []
let prefix = ''

/** 所有自动化写操作经 5174 → 8081 落到独立 roadmind_test，不访问开发库。 */
test.beforeEach(async ({ page, request }) => {
  ids = []; runtimeErrors = []
  prefix = 'P3-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
  await page.addInitScript(() => localStorage.setItem('roadmind-knowledge-mode', 'real'))
  page.on('pageerror', error => runtimeErrors.push(error.message))
  const health = await request.get('/api/health')
  expect(health.ok()).toBe(true)
})

test.afterEach(async ({ request }) => {
  // 只逻辑删除本测试创建的 ID，不清表、不改 Flyway 历史或其他数据。
  for (const id of ids) {
    const response = await request.delete('/api/knowledge-bases/' + id)
    expect([200, 404]).toContain(response.status())
  }
  expect(runtimeErrors).toEqual([])
})

async function seed(request: APIRequestContext, suffix = '资料', category = '日常养护') {
  const response = await request.post('/api/knowledge-bases', { data: { name: prefix + '-' + suffix, description: '真实 API 联调测试记录', category } })
  expect(response.status()).toBe(201)
  const record: RecordData = (await response.json()).data
  ids.push(record.id)
  return record
}

test('通过界面完成真实创建、刷新持久化、编辑、取消删除及确认删除', async ({ page, request }) => {
  await page.goto('/knowledge')
  await expect(page.locator('.knowledge-mode-bar')).toContainText('当前知识库来自 MySQL')
  await page.locator('.real-knowledge > header').getByRole('button', { name: '创建知识库', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '创建知识库', exact: true })
  await dialog.getByRole('textbox', { name: '知识库名称' }).fill(prefix + '-界面创建')
  await dialog.getByRole('textbox', { name: '知识库描述' }).fill('浏览器创建后应保存到 MySQL，刷新后仍存在。')
  const created = page.waitForResponse(response => new URL(response.url()).pathname === '/api/knowledge-bases' && response.request().method() === 'POST')
  await dialog.getByRole('button', { name: '创建知识库', exact: true }).click()
  const response = await created
  expect(response.status()).toBe(201)
  const record: RecordData = (await response.json()).data
  ids.push(record.id)
  const card = page.locator('.knowledge-space-card').filter({ hasText: record.name })
  await expect(card).toBeVisible()
  await expect(card).toContainText('0 份文档')
  await page.reload()
  await expect(card).toBeVisible()
  const persisted = await request.get('/api/knowledge-bases/' + record.id)
  expect((await persisted.json()).data.name).toBe(record.name)
  await card.getByRole('button', { name: '知识库操作：' + record.name }).click()
  await page.getByRole('menuitem', { name: '编辑知识库', exact: true }).click()
  const edit = page.getByRole('dialog', { name: '编辑知识库', exact: true })
  await expect(edit.getByRole('textbox', { name: '知识库描述' })).toHaveValue('浏览器创建后应保存到 MySQL，刷新后仍存在。')
  await edit.getByRole('textbox', { name: '知识库名称' }).fill(prefix + '-已修改')
  await edit.getByRole('button', { name: '保存修改' }).click()
  const updatedCard = page.locator('.knowledge-space-card').filter({ hasText: prefix + '-已修改' })
  await expect(updatedCard).toBeVisible()
  const updated = await request.get('/api/knowledge-bases/' + record.id)
  expect((await updated.json()).data.name).toBe(prefix + '-已修改')
  await updatedCard.locator('.icon-button').click()
  await page.getByRole('menuitem', { name: '删除知识库', exact: true }).click()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(updatedCard).toBeVisible()
  await updatedCard.locator('.icon-button').click()
  await page.getByRole('menuitem', { name: '删除知识库', exact: true }).click()
  await page.getByRole('button', { name: '确认删除', exact: true }).click()
  await expect(updatedCard).toHaveCount(0)
  expect((await request.get('/api/knowledge-bases/' + record.id)).status()).toBe(404)
})

test('必填校验阻止提交，后端重名 409 显示中文且不关闭弹窗', async ({ page, request }) => {
  const record = await seed(request, '重复名称')
  await page.goto('/knowledge')
  await page.locator('.real-knowledge > header').getByRole('button', { name: '创建知识库', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '创建知识库', exact: true })
  let posts = 0
  page.on('request', value => { if (value.method() === 'POST') posts++ })
  await dialog.getByRole('button', { name: '创建知识库', exact: true }).click()
  await expect(dialog).toContainText('请输入知识库名称')
  expect(posts).toBe(0)
  await dialog.getByRole('textbox', { name: '知识库名称' }).fill(record.name)
  await dialog.getByRole('button', { name: '创建知识库', exact: true }).click()
  await expect(page.getByText('已存在同名知识库，请使用其他名称', { exact: true })).toBeVisible()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.locator('.knowledge-space-card')).toHaveCount(1)
})

test('搜索、分类及服务端分页传递真实参数并显示正确结果', async ({ page, request }) => {
  for (let index = 0; index < 10; index++) await seed(request, '分页' + index)
  await seed(request, '设施', '设施管理')
  await page.goto('/knowledge')
  await expect(page.locator('.knowledge-space-card')).toHaveCount(8)
  await page.locator('.knowledge-pagination .el-select').click()
  await page.getByRole('option', { name: '4条/页', exact: false }).click()
  await expect(page.locator('.knowledge-space-card')).toHaveCount(4)
  const next = page.waitForResponse(response => response.request().method() === 'GET' && new URL(response.url()).searchParams.get('page') === '2')
  await page.locator('.knowledge-pagination .btn-next').click()
  expect((await (await next).json()).data.page).toBe(2)
  await expect(page.locator('.knowledge-pagination .el-pager .is-active')).toHaveText('2')
  await page.getByRole('textbox', { name: '搜索知识库', exact: true }).fill(prefix + '-设施')
  await expect(page.locator('.knowledge-space-card')).toHaveCount(1)
  await expect(page.locator('.knowledge-space-card')).toContainText(prefix + '-设施')
  await page.locator('.real-knowledge .category-tabs > button').filter({ hasText: '技术规范' }).click()
  await expect(page.locator('.knowledge-space-card')).toHaveCount(0)
  await expect(page.locator('.real-knowledge')).toContainText('暂无知识库')
  await page.locator('.real-knowledge .category-tabs > button').filter({ hasText: '行业指南' }).click()
  await expect(page.locator('.knowledge-space-card')).toHaveCount(1)
})

test('服务失败显示错误和重试，始终保留真实模式且不塞入 Mock 卡片', async ({ page }) => {
  const pattern = '**/api/knowledge-bases?*'
  await page.route(pattern, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 503, message: '数据库服务暂不可用，请稍后重试', data: null, timestamp: new Date().toISOString() }) }))
  await page.goto('/knowledge')
  await expect(page.getByRole('alert')).toContainText('数据库服务暂不可用，请稍后重试')
  await expect(page.locator('.knowledge-space-card')).toHaveCount(0)
  await expect(page.locator('.knowledge-mode-bar')).toContainText('当前知识库来自 MySQL')
  await page.unroute(pattern)
  await page.getByRole('button', { name: '重新加载', exact: true }).click()
  await expect(page.locator('.knowledge-error')).toHaveCount(0)
  await expect(page.locator('.real-knowledge')).toContainText('暂无知识库')
})

test('Mock 模式独立保留，本地创建不进入真实列表或统计', async ({ page, request }) => {
  const real = await seed(request, '真实记录')
  await page.goto('/knowledge')
  await expect(page.locator('.knowledge-space-card')).toHaveCount(1)
  await page.locator('.knowledge-mode-bar .el-select').click()
  await page.getByRole('option', { name: '演示数据（Mock）', exact: true }).click()
  await expect(page.locator('.knowledge-space-card')).toHaveCount(4)
  await page.locator('.my-knowledge > header').getByRole('button', { name: '创建知识库', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '创建知识库' })
  await dialog.getByRole('textbox', { name: '知识库名称' }).fill(prefix + '-仅演示')
  await dialog.getByRole('button', { name: '创建演示知识库' }).click()
  await expect(page.locator('.knowledge-space-card')).toHaveCount(5)
  expect((await (await request.get('/api/knowledge-bases', { params: { keyword: prefix + '-仅演示' } })).json()).data.total).toBe(0)
  await page.locator('.knowledge-mode-bar .el-select').click()
  const restored = page.waitForResponse(response => response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/knowledge-bases')
  await page.getByRole('option', { name: '真实数据（MySQL）', exact: true }).click()
  expect((await (await restored).json()).data.total).toBe(1)
  await expect(page.locator('.knowledge-space-card')).toHaveCount(1)
  await expect(page.locator('.knowledge-space-card')).toContainText(real.name)
  await expect(page.locator('.knowledge-pagination')).toContainText('共 1 个知识库')
})

test('真实详情不展示演示文档，已删除资源刷新后给出错误', async ({ page, request }) => {
  const record = await seed(request, '详情验证')
  await page.goto('/knowledge/' + record.id)
  await expect(page.getByRole('heading', { name: record.name, exact: true })).toBeVisible()
  await expect(page.locator('.document-panel')).toContainText('0 份文档')
  await expect(page.locator('.document-panel')).toContainText('本阶段仅管理知识库元数据')
  await expect(page.locator('.el-upload__input')).toHaveCount(0)
  await request.delete('/api/knowledge-bases/' + record.id)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('知识库不存在或已删除')
  await expect(page.locator('.document-panel')).toHaveCount(0)
})

test('真实卡片在两种桌面视口及手机视口无横向溢出', async ({ page, request }, info) => {
  await seed(request, '真实卡片')
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/knowledge')
    await expect(page.locator('.knowledge-space-card')).toHaveCount(1)
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: info.outputPath('knowledge-real-' + viewport.width + '.png'), fullPage: true })
  }
})