# 工作台视觉重构与验证

> 本文保留上一轮工作台改造记录；后续六页实现、当前页面和最新验证见[六页交付记录](frontend-six-page-verification.md)。

验证日期：2026-10-26。项目路径：`C:\Users\31603\Desktop\RoadMind V1.0\roadmind-frontend`。

## 本次范围

- 重做浅色侧边导航、功能分组、工具栏、搜索入口和演示说明。
- 工作台首屏改为行业问题输入、知识范围选择、快捷提问；移除问答趋势图。
- 中部展示知识库、上传 / 创建入口、最近对话与待处理记录；统计移至末尾。
- 统一中性背景、科技蓝、文字层级、8px 主间距、圆角、边框和焦点状态。普通页面标题 24–28px，正文与输入 14–16px，辅助信息按层级缩小。
- 保留所有业务路由、Pinia 状态和演示数据层；其他页面不做全面重写。
- 修复此前未完成的三类类型问题：上传数量提示回调、键盘事件联合类型、Element Plus 通用表格行与业务文档类型的边界。

## 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/layouts/AppLayout.vue` | 导航、工具栏、搜索及工作空间说明 |
| `src/views/DashboardView.vue` | AI 优先工作台与现有会话 / 文档流程连接 |
| `src/styles/tokens.scss` | 品牌、字级、间距与 Element Plus 变量 |
| `src/styles/main.scss` | 基础样式、公共组件、导航及响应式 |
| `src/styles/dashboard.scss` | 工作台布局及交互样式 |
| `tests/workbench.spec.ts` | 交互、Mock 边界与响应式回归 |
| `playwright.config.ts` | 使用本机 Edge 的可复现浏览器检查 |

## 已执行验证

```powershell
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-frontend'
npm install --no-fund
npm install --save-dev --save-exact typescript@6.0.3 --no-fund
npm ls --depth=0
npm run dev
npm run typecheck
npm run test:e2e
npm run build
npm run preview
```

- npm 安装成功，安装时审计结果 0 个漏洞；锁文件已生成。
- 开发服务器成功运行于 <http://127.0.0.1:5173/dashboard>。
- Vue 模板、业务 TypeScript、Vite 与测试配置类型检查通过。
- 9 项浏览器测试通过，覆盖提问与知识范围传递、回复中断、引用、换行与提交、本地知识库创建、文件登记、会话与任务恢复、搜索、原有页面和手机导航。
- 浏览器检查 320、390、768、1024、1440px 屏宽；工作台没有横向溢出。
- 五个业务页面均可访问，测试过程中没有页面异常、控制台错误或意外 `/api/` 业务请求。
- `npm run build` 成功，生产产物位于 `dist/`，页面通过动态路由加载。
- 在 4173 端口实查生产构建：HTTP 200，首页提问可跳转聊天，无页面或控制台错误。验证结束后关闭临时生产预览，保留 5173 开发入口。
- 生产页面实测首页标题 28px、副标题 14px、问题输入 16px、导航 14px；390px 视口的页面宽度为 390px，任务内容可用宽度为 350px。
- 通过截图实查标题、输入框、对齐、间距与窄屏布局；修正了窄屏任务区域未铺满可用宽度的问题。
- 与开发前 SHA-256 基线比较，13 个后端源码 / 配置文件保持一致。

浏览器测试报告位于 `roadmind-frontend/playwright-report/`，可通过 `npx playwright show-report` 查看；生成报告和 `test-results/` 均已忽略。

## 实际限制

这是可交互的前端演示工作空间。业务数据、回复、检索和任务状态仍为 Mock；没有接入真实知识库、文档上传、AI 推理或病害诊断。当前无阻止开发预览或生产构建的问题。

下一步优先按同一视觉系统完善知识库文档管理与聊天体验，并在真实业务接口确定后逐步替换演示适配层。
