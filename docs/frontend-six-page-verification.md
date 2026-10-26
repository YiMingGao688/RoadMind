# RoadMind 六页面实现与验证

日期：2026-10-26。工程：`roadmind-frontend`。依据为用户提供的[六页参考图](design/roadmind-six-page-reference.png)与[完整需求](design/six-page-requirements.md)。本轮检查了现有路由、Pinia、文件登记和 Mock 实现后继续开发，没有更换技术栈或修改 Java 后端。

## 六页交付

| 页面 | 完成内容 | 1440×900 截图 | 1920×1080 截图 |
| --- | --- | --- | --- |
| AI 智能助手首页 | 道路/桥梁背景、品牌、指定标题、大输入框、知识范围、四个快捷提问，无 KPI 和统计图 | [首页](design/screenshots/home-1440x900.png) | [首页](design/screenshots/home-1920x1080.png) |
| 对话与引用 | 全局历史、结构化 Markdown、多轮/停止/错误/重试、复制/改名/本地导出、引用开合与资料定位 | [对话](design/screenshots/chat-1440x900.png) | [对话](design/screenshots/chat-1920x1080.png) |
| 知识探索 | 搜索、类别/格式筛选、结果选择、目录定位、手写片段预览、资料提问 | [探索](design/screenshots/explore-1440x900.png) | [探索](design/screenshots/explore-1920x1080.png) |
| 公路养护助手 | 道路背景、四个任务入口、输入校验、单病害/综合模板、案例带入、结构化建议与依据 | [养护](design/screenshots/maintenance-1440x900.png) | [养护](design/screenshots/maintenance-1920x1080.png) |
| 我的知识库 | 照片卡片/列表、类别/名称筛选、创建与重复校验、文档详情/状态、本地文件登记 | [知识库](design/screenshots/knowledge-1440x900.png) | [知识库](design/screenshots/knowledge-1920x1080.png) |
| RAG 实验室 | Dense/BM25/RRF/Rerank 参数、Top K/阈值、模拟执行、Chunk、召回/重排/耗时/详情与来源 | [RAG](design/screenshots/rag-1440x900.png) | [RAG](design/screenshots/rag-1920x1080.png) |

两种桌面视口保留侧栏、双栏结果和引用阅读区；长回答、检索结果与预览内容通过独立滚动阅读。手机导航与引用使用抽屉，搜索和检索配置按窄屏顺序排列。截图为浏览器实际渲染，未经生成式图片工具修改。

## 工程与复用

- `layouts/AppLayout.vue`：AI 应用外壳、轻量搜索工具栏、移动导航、演示说明及重置入口。
- `components/AppSidebar.vue`：品牌、新建会话、五个主要功能、最近对话、折叠和用户菜单。
- `ChatComposer`、`ChatMessage`、`MarkdownContent`：共用输入、消息结构与安全 Markdown。
- `SourceCitation`、`DocumentPreview`、`SearchResultItem`：来源与资料预览共用，保留未来原文 URL/PDF.js 边界。
- `KnowledgeCard`：照片卡片与本地菜单；原有创建弹窗、上传校验和文件状态规则继续使用。
- `stores/chat.ts`：中断会话流、捕获当前消息对象、错误重试原位更新，不重复用户记录。
- `composables/useAssistantNavigation.ts`：首页、探索与资料页统一交接问题和知识范围。
- `mocks/catalog.ts`、`chat.ts`、`maintenance.ts`、`services.ts`：独立演示数据与行为；`api/` 不伪造成功返回。
- `types/knowledge.ts`、`types/chat.ts`、`types/domain.ts`：资料预览、流事件和领域字段，配有实际含义注释。
- `styles/tokens.scss`、`ai-layout.scss`、`ai-pages.scss`、`ai-chat.scss`：共享颜色/字级/间距及六页布局。

详细目录与锁定依赖见[前端 README](../roadmind-frontend/README.md)。在用交通图片通过内置 imagegen 生成并保存为 WebP，五份合计 312,992 字节；[素材与提示规格](../roadmind-frontend/src/assets/images/README.md)。中文 MiSans、英文/数字 Inter，授权和来源见[字体说明](../roadmind-frontend/src/assets/fonts/README.md)。

## 实际验证

执行环境：Windows PowerShell、Node 24.15.0、npm 11.12.1、Microsoft Edge **156.0.4314.42**。

```powershell
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-frontend'
npm ls --depth=0
npm run typecheck
npm run build
npm run test:e2e
npm run preview
```

| 检查 | 实际结果 |
| --- | --- |
| 依赖状态 | `npm ls --depth=0` 成功，无 missing/invalid 依赖 |
| TypeScript | Vue 应用与 Node 配置均通过检查 |
| 生产构建 | `vite build` 成功，生成 `dist/`，页面按路由拆分 |
| 开发启动 | `npm run dev` 实际运行，5173 可访问 |
| 浏览器回归 | **17 / 17 通过**，完整回归耗时约 1.6 分钟 |
| 桌面检查 | 六页面 × 1440×900 / 1920×1080，均可访问且没有横向溢出 |
| 其他屏宽 | 320 / 390 / 768 / 1024 下检查六页；手机导航及引用抽屉通过 |
| Markdown | 实际组件 DOM 检查：不执行原始 HTML、危险 URL，不加载远程图片；合法链接有安全 rel |
| 状态与边界 | 输入换行/回车、会话范围、多轮/切换/停止/原位重试、引用关闭/恢复、目录定位、复制/下载通过 |
| 文件登记 | 必填/重复名称、非法格式、超过 20 MB、重复文件及 local 状态通过；未上传文件内容 |
| 生产预览 | `npm run preview` 的构建产物六页在两种桌面视口均返回 HTTP 200 |
| 运行与资源 | 生产检查的控制台错误/警告、失败请求、破损图片、业务 API 请求均为 0 |
| 实际字体 | Chrome DevTools Protocol 确认首页中文字形使用本地 `MiSans-Semibold`，不是仅声明字体名 |
| 后端边界 | 与本轮前的 SHA-256 快照比较，13 个后端源码及配置文件无改动；未重跑或声称新通过后端测试 |

生产检查原始数据：[verification.json](design/screenshots/verification.json)。截图目录还保存首页、聊天及养护的 390×844 示例。浏览器交互用例为 `tests/workbench.spec.ts`，HTML 测试报告为本地生成的 `roadmind-frontend/playwright-report/index.html`（已忽略提交）。

根据首轮截图修正了 RAG 配置过松、主操作落到首屏外，以及资料预览按钮覆盖内容的问题，并将预览标记等细小文字统一到至少 12px；调整后再次检查两种桌面视口。没有执行 Git 初始化、提交、推送或修改远程仓库。

本轮无未解决的类型、构建或浏览器运行错误。Lucide 的指定包名存在迁移提示，当前版本可正常使用；中文完整字体约 10 MB，保留授权原件，通过 `font-display: swap` 与缓存显示，后续性能优化需要同时核对授权。

## 真实能力与尚未接入部分

**真实前端能力**：路由、表单校验、本地状态、文件元数据校验、消息排版/复制/下载、筛选、抽屉和引用联动。它们不依赖业务后端即可体验。

**Mock**：所有业务资料、知识正文、页码、索引状态、问答文本、养护建议、RAG 分数及阶段耗时均为手写样本或固定模板。当前搜索仅为关键词筛选，聊天流仅为文本分段播放，不能称为真实 AI、SSE、Embedding、BM25、RRF 或 Rerank 算法执行。刷新恢复样本。

**尚未完成**：知识库/文件的服务端持久化、真实上传/解析/索引任务、原始 PDF/Word 阅读、模型问答/SSE、Milvus/Embedding/Rerank、真实交通业务、登录权限及正式生产部署。这些属于后续阶段，不是本次前端演示中的已完成能力。

## 下一阶段接入建议

1. 先与后端确认知识库、文档元数据及分页接口的 DTO/VO，沿用现有统一响应和错误处理。将 workspace 的 Mock 实现逐步替换为 `api/` 请求，不在 Axios 拦截器里伪造成功。
2. 接入 MySQL + MyBatis-Plus 和 MinIO 后，再实现真实上传、进度、任务状态及重试；只有后端确认后才变更上传/索引状态。
3. 有真实可授权原文后接入 PDF.js，并以 `documentId/page/chunkId` 定位；演示页码不能直接迁移为真实定位信息。
4. Spring AI 2.0.2 按模块接入后，以明确的 SSE 事件协议实现 `ChatTransport`，约定错误、结束、取消与引用事件；演示开关与真实模式应显式区分。
5. 最后接入真实检索调试 API，返回参数快照、候选集、召回/重排分数与测量耗时，再进行可复现的 RAG 评估。