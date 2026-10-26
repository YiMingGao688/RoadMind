# RoadMind V1.0（智路知枢）

面向公路交通养护行业的企业级 RAG 知识库与 AI Agent 智能辅助决策系统，用于解决行业知识查询、文档依据核查与业务信息辅助查询问题，同时展示 Java 与 AI Agent 的工程实现能力。

项目采用前后端分离的模块化单体架构，按实际需求逐步引入中间件。当前已完成后端基础工程、前端六页面与真实 MySQL 知识库管理闭环；文档、RAG、Agent 和交通业务仍处于后续阶段。

## 当前能力

- 基于 Java 21 与 Spring Boot 4.1.2 的 Maven 后端工程。
- 统一业务 API 响应、全局异常处理与 Jakarta Validation 参数校验基础能力。
- `GET /api/health` 应用存活检查，使用统一响应格式。
- `GET /actuator/health` 运维健康检查，保留 Actuator 标准格式，只暴露 health 端点。
- 覆盖健康检查、校验失败、HTTP 错误状态及内部异常隐藏规则的自动化测试。
- 前端保留六页 AI 应用设计；我的知识库已接入真实 API，其他业务继续明确标记 Mock。
- 知识库支持创建、分页/名称/分类查询、详情、修改与逻辑删除，刷新后数据库记录仍保留；真实文档数暂为 0。
- Mock 知识库使用独立演示模式，不与真实记录、数量混合；保留既有会话、引用和本地文件登记体验。

## 技术栈与版本

| 技术 | 版本 / 状态 | 使用方式 |
| --- | --- | --- |
| Java | 21 | 编译与运行基线 |
| Spring Boot | 4.1.2 | parent 统一管理 Spring、Jackson、日志、测试与 Maven 插件版本 |
| Maven | 3.6.3 或更高版本 | 构建、测试与打包 |
| Spring MVC | 由 Boot 4.1.2 管理 | 使用 `spring-boot-starter-webmvc` |
| Validation、Actuator、Lombok | 由 Boot 4.1.2 管理 | 不单独覆盖底层版本 |
| 测试 | 由 Boot 4.1.2 管理 | `spring-boot-starter-webmvc-test`，传递包含 Spring Boot Test |
| Spring AI | 2.0.2，仅导入 BOM | 当前无 AI 运行时依赖、模型配置或旧版 AI API |
| MyBatis-Plus | 3.5.17 | Boot 4 Starter + 同版本分页插件 |
| MySQL / Connector-J | 本机 8.0.35 / 9.7.0 | Connector 版本由 Boot 管理，8.4 为后续实机兼容目标 |
| Flyway | 12.4.0 | Boot 4 Flyway Starter + MySQL 模块，版本化 SQL 迁移 |

MySQL 已接入；后续按阶段接入 Redis、Milvus、MinIO；RabbitMQ 仅在确有异步任务需求时引入；Spring Security 用于后续权限模块。前端已使用 Vue 3、TypeScript、Vite、Element Plus、Vue Router、Axios、Pinia 和 SCSS，具体版本见 [前端说明](roadmind-frontend/README.md)。部署计划使用 Docker / Docker Compose、Nginx 与 Linux。

当前启用 MySQL 与 Flyway。连接凭据由环境变量提供，本地启动脚本读取已忽略的 `.env.local`；不接入缓存、向量库、模型服务或 Spring AI Alibaba。

版本依据见 [整体架构设计](docs/architecture.md#版本依据)，实际执行结果见 [验证记录](docs/verification.md)。Spring AI 仍仅管理版本；持久层已完成真实 MySQL 集成。当前 API、SQL 与测试结果见[知识库接口设计](docs/knowledge-base-api.md)和[第三阶段验证](docs/phase3-verification.md)。

## 目录结构

```text
RoadMind V1.0/
├── roadmind-backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/roadmind/
│       │   │   ├── RoadMindApplication.java
│       │   │   ├── common/          # 统一响应与异常处理
│       │   │   ├── health/          # 健康检查 Controller / VO
│       │   │   ├── knowledge/       # Controller / Service / Mapper / DTO / VO / Entity
│       │   │   ├── rag/             # RAG 边界，仅包说明
│       │   │   ├── agent/           # Agent 边界，仅包说明
│       │   │   └── traffic/         # 交通业务边界，仅包说明
│       │   └── resources/application.yml
│       └── test/java/com/roadmind/  # 健康、异常与独立 MySQL 集成测试
├── roadmind-frontend/              # Vue 3 演示工作空间
│   ├── src/                       # api / mocks / stores / views / styles 等
│   ├── tests/                     # 浏览器交互与响应式回归检查
│   ├── package.json
│   └── README.md
├── docs/
│   ├── architecture.md
│   ├── development-plan.md
│   └── verification.md
├── .gitignore
└── README.md
```

## 启动与测试（Windows PowerShell）

先确认 JDK 21 与 Maven 可用：

```powershell
java -version
javac -version
mvn -version
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-backend'
```

先按[接口与启动说明](docs/knowledge-base-api.md#本地启动)配置 `.env.local` 并创建开发/测试数据库，再执行完整构建与测试：

```powershell
.\scripts\test-backend.ps1 -Package
```

开发启动：

```powershell
.\scripts\start-backend.ps1
```

或在构建成功后运行可执行 JAR：

```powershell
.\scripts\start-backend.ps1 -Jar
```

在另一个 PowerShell 窗口中检查接口：

```powershell
Invoke-RestMethod 'http://localhost:8080/api/health' | ConvertTo-Json -Depth 5
Invoke-RestMethod 'http://localhost:8080/actuator/health'
```

业务健康接口的响应示例（时间为示意值）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "application": "roadmind-backend",
    "status": "UP"
  },
  "timestamp": "2026-10-26T00:00:00Z"
}
```

端口默认为 8080，可通过 `SERVER_PORT` 环境变量或命令行参数覆盖，不需要修改配置文件。例如：

```powershell
$env:SERVER_PORT = '8082'
.\scripts\start-backend.ps1 -Jar
```

业务健康接口表示进程能处理 HTTP 请求；Actuator 会检查已接入的数据源。模型、缓存和向量库尚未接入。

## 前端启动与验证（Windows PowerShell）

本机已验证 Node 24.15.0、npm 11.12.1。已有 `package-lock.json`；首次检出可执行 `npm ci`，安装依赖时也可使用 `npm install`。

```powershell
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-frontend'
npm install
npm run dev
```

打开 <http://127.0.0.1:5173/dashboard>。另一个窗口中可执行 `npm run typecheck`、`npm run build` 和 `npm run test:e2e`。浏览器检查在 Windows 上使用已安装的 Edge；其他系统的浏览器准备见前端说明。

真实知识库操作写入 MySQL；独立 Mock 操作只保存在页面会话。文件内容尚不上传，问答和检索仍为预设演示。当前六页范围、17 项浏览器测试与两种桌面尺寸截图见 [六页交付验证记录](docs/frontend-six-page-verification.md)。

## 后续功能规划

1. 扩展真实文档元数据，与已完成的知识库管理建立关联。
2. 接入 MinIO，开发文档上传、PDF / Word 解析、切片与入库状态管理。
3. 按模块接入 Spring AI 2.0.2、Embedding 与 Milvus，实现基础 RAG 与来源引用。
4. 增加混合检索、Rerank、检索调试与可复现的效果评估。
5. 通过 Agent Tool Calling 查询公路病害、交通事件与巡检设备信息。
6. 完成前端管理与问答界面、权限审计和容器化部署。

阶段目标与验收边界见 [开发计划](docs/development-plan.md)。

## 开发约定

- 优先保持模块内高内聚，业务出现后再建立 Controller → Service → Mapper 分层，不创建无实际职责的空实现。
- Controller 负责协议与参数校验，Service 负责业务规则和事务，Mapper 负责数据访问；DTO / VO 与实体按用途区分。
- 请求体使用 `@Valid` 与 `jakarta.validation` 约束；Controller 方法参数使用 Spring MVC 内置校验，不重复声明校验器。
- Service 的 public 方法和包含业务逻辑的 private 方法编写准确的中文 Javadoc；数据字段说明业务含义和来源。
- 配置中的真实密码、Token、模型密钥与连接凭据仅通过环境变量注入，不提交 Git；日志与响应不公开内部异常详情。
- 保持最小改动，新增依赖前核对兼容性，完成修改后执行相关编译和测试。
- 不自动提交或推送 Git；现有 `.gitignore` 保留，用于忽略构建产物、依赖、日志及本地敏感配置。
