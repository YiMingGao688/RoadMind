# RoadMind AI 知识工作空间

面向公路交通养护行业的 Vue 3 前端。六页面沿用已确定的 AI 应用设计。我的知识库已接入真实 Spring Boot / MySQL API；其他业务保留独立演示，模型和向量库尚未接入。

## 页面与路由

| 页面 | 路由 | 当前交互 |
| --- | --- | --- |
| AI 智能助手首页 | `/dashboard`（兼容 `/assistant`） | 道路与桥梁背景、问题输入、知识范围、四个快捷提问；没有 KPI 或运营图表 |
| AI 对话与引用 | `/chat` | 新建、多轮、历史切换、Markdown、复制、本地导出、停止/重试、引用开合及资料详情 |
| 知识探索 | `/explore` | 关键词/分类/格式筛选、结果选择、目录与片段定位、演示预览、转入问答 |
| 公路养护助手 | `/maintenance` | 单病害/综合分类输入、示例案例、处置流程模板、结构化演示结果及依据 |
| 我的知识库 | `/knowledge`、`/knowledge/:id` | 默认真实 CRUD、服务端搜索/分页、编辑删除及刷新持久化；另有独立 Mock 模式 |
| RAG 实验室 | `/rag` | Dense/BM25/RRF/Rerank 配置、Top K/阈值、召回/重排/耗时/详情切换 |

左侧为统一 AI 导航、最近会话和用户菜单，支持折叠及手机抽屉。原有业务路径继续可用，顶部不使用后台面包屑。

## 安装、启动与验证

本机实际环境：Node **24.15.0**、npm **11.12.1**。项目已有锁文件，首次检出可使用 `npm ci`。当前 Vite 的 Node 基线可见 `package.json` 的 `engines`。

```powershell
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-frontend'
npm ci
npm run dev
```

开发地址：[http://127.0.0.1:5173/dashboard](http://127.0.0.1:5173/dashboard)。端口固定为 5173，占用时明确报错。

```powershell
npm run typecheck
npm run build
npm run test:e2e
npm run test:e2e:api  # 需先启动 8081 独立测试库后端
npm run preview
```

`build` 先执行完整类型检查，再生成 `dist/`。`preview` 使用 4173，仅用于本地检查构建产物。Windows 浏览器测试使用本机 Microsoft Edge；其他平台需先准备 Playwright Chromium。测试会复用现有开发服务器，没有运行实例时自动启动。

## 实际依赖版本

| 依赖 | 锁定版本 |
| --- | --- |
| Vue / Vue Router / Pinia | 3.5.44 / 5.4.0 / 4.1.0 |
| TypeScript / vue-tsc | 6.0.3 / 3.3.13 |
| Vite / Vue 插件 | 8.3.5 / 6.0.10 |
| Element Plus | 2.14.7 |
| Lucide（`lucide-vue-next`） | 1.0.0 |
| Axios / Sass | 1.20.0 / 1.106.1 |
| Markdown-it / 类型声明 | 15.0.3 / 14.2.0 |
| Playwright Test | 1.64.1 |

版本以 `npm ls --depth=0` 和 `package-lock.json` 为准。TypeScript 采用与当前 vue-tsc 实际兼容的 6.0.3。Lucide 包安装时提示已迁移到 `@lucide/vue`；本次保留用户指定包名，当前编译和运行均通过，没有加入另一套 UI 组件库。

## 目录与组件职责

```text
src/
├── api/              # 真实 Axios 请求入口与现有健康 API，不返回假成功
├── assets/
│   ├── fonts/        # 本地 MiSans、Inter 及授权说明
│   └── images/       # 生成的道路照片、知识库封面与素材记录
├── components/
│   ├── AppSidebar.vue
│   ├── ChatComposer.vue
│   ├── ChatMessage.vue
│   ├── MarkdownContent.vue
│   ├── SourceCitation.vue
│   ├── DocumentPreview.vue
│   ├── SearchResultItem.vue
│   ├── KnowledgeCard.vue
│   ├── DocumentUpload.vue
│   ├── KnowledgeCreateDialog.vue
│   └── icons.ts      # 统一 Lucide SVG 导出
├── composables/      # 首页、探索与资料入口的问答导航
├── layouts/          # AI 外壳、搜索、移动导航与演示说明
├── mocks/            # 样本、搜索、回复、养护模板、检索规则与封面映射
├── router/           # 六页面及知识库详情
├── stores/           # 会话、播放中断、原位重试和本地知识记录
├── styles/           # tokens/fonts + ai-layout/ai-pages/ai-chat
├── types/            # 领域模型、资料预览模型及未来流式适配契约
└── views/            # 六个页面与未找到页面
tests/                 # 17 项交互、状态、安全和响应式回归
```

`tokens.scss` 统一颜色、字体、间距、圆角和 Element Plus 变量。正文 14–16px，辅助信息 13px，少量标签 12px；首页主标题 34px，常规页面标题 26px。旧基础样式继续服务文档表格等有效组件，新 AI 布局使用独立样式文件，避免改动无关后端模块。

## 第三阶段：真实知识库

开发后端需先按[知识库启动说明](../docs/knowledge-base-api.md#本地启动)配置环境并运行在 8080。打开 `/knowledge` 默认使用“真实数据（MySQL）”，Vite 将 `/api` 代理到后端，浏览器刷新保留数据库记录。

- `api/knowledge-bases.ts` 与 `types/knowledge-api.ts` 对齐真实 DTO/VO 和分页模型。
- `KnowledgeRealView` 管理真实状态、请求取消、搜索/分页、编辑与确认删除，不导入演示记录。
- `KnowledgeDemoView` 保留原有效演示逻辑；`knowledge-mode` Store 只保存来源选择。
- `KnowledgeCreateDialog` 与 `KnowledgeCard` 复用同一设计，真实模式只在后端确认成功后刷新。
- 真实文档数为 0，详情不展示 Mock 文档；上传按钮仅说明下一阶段能力。
- Axios 将后端 400/404/409/503 的公开提示传给界面，不在失败时回退 Mock。

真实浏览器测试单独使用 5174 → 8081 → roadmind_test，避免污染开发数据：

```powershell
# 后端目录，在单独窗口运行
.\scripts\start-backend.ps1 -Jar -TestDatabase
# 前端目录
npm run test:e2e:api
```

`npm run test:e2e` 的 17 项原有回归显式选择演示模式；`test:e2e:api` 的 7 项验证真实 CRUD、刷新、分页、中文错误、模式隔离及响应式布局。测试产物在 `test-results-api/` 与 `playwright-report-api/`，已忽略提交。

最新结果见[第三阶段验证](../docs/phase3-verification.md)。
## 其他功能的 Mock 边界

**已实现的前端能力：** 路由、输入校验、筛选、知识库本地创建、文件元数据登记、会话切换、复制/导出、Markdown 排版、引用定位、停止/错误重试与响应式布局。

**仅演示：** 问答回复、知识正文与页码、索引状态、RAG 分数/耗时、养护原因与建议。它们来自 `mocks/`，页面始终有演示标识。这些 Mock 数据只保存于当前页面会话，刷新即恢复初始样本；真实知识库元数据保存在 MySQL。

- 独立演示模式的上传仅选择 PDF/DOC/DOCX、校验单文件不超过 20 MB，每次最多 5 个，再登记名称和大小。内容不上传、不解析、不向量化；状态保持“本地待上传”。
- 知识探索页的搜索是在手写资料中进行浏览器关键词筛选，不是语义搜索或真实 BM25。
- 聊天是固定模板分段播放，不是真实模型生成，也没有建立 SSE 连接。
- Markdown 关闭原始 HTML，保留危险 URL 校验，隐藏远程图片，外链添加 `noopener noreferrer`；用户输入使用文本插值。
- `DocumentPreview` 展示手写演示片段，不提供完整 PDF。`PreviewDocument.originalUrl` 与预览容器预留后续 PDF.js 接入边界。
- `types/chat.ts` 是前端内部事件契约，后端 SSE 协议需要双方另行确认，不能直接宣称已实现。
- `VITE_` 配置会公开到浏览器，不能放模型密钥、密码或服务端令牌。

## 验证与素材

本轮通过类型检查、生产构建及 **17 项 Edge 浏览器测试**；六页面在 **1440×900、1920×1080** 下完成实际截图复核，并检查 320、390、768、1024 屏宽。截图、未接入部分及后续接口建议见 [六页交付验证记录](../docs/frontend-six-page-verification.md)。

[参考设计与需求](../docs/design/six-page-requirements.md)、[素材与生成提示](src/assets/images/README.md)、[字体授权](src/assets/fonts/README.md)。字体完整文件约 10 MB，使用本地资源、浏览器缓存与 `font-display: swap`；本轮没有擅自对子集或字形进行修改。