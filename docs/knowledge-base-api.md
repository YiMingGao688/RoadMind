# 知识库管理 API 与数据库设计

第三阶段仅管理知识库元数据。真实接口使用 Java 21、Spring Boot 4.1.2、MyBatis-Plus 3.5.17 Boot 4 Starter、MySQL 和 Flyway，不接入模型、Milvus、Redis 或 MinIO，不建立用户表或模拟用户 ID。

## 版本与依赖

本机实际 MySQL **8.0.35**。SQL 采用 MySQL 8.0 / 8.4 支持的语法；本轮没有启动 8.4 实例，因此不宣称已经完成 8.4 实机验证。

| 依赖 | 实际解析版本 | 管理方式 |
| --- | --- | --- |
| Spring Boot | 4.1.2 | 现有 parent |
| MyBatis-Plus Boot 4 Starter | 3.5.17 | 现有 dependencyManagement，本阶段启用 |
| MyBatis-Plus JSqlParser | 3.5.17 | 与主依赖同版本，用于分页插件 |
| MyBatis / MyBatis-Spring | 3.5.19 / 4.0.0 | Starter 传递依赖 |
| MySQL Connector/J | 9.7.0 | Boot parent 管理，runtime |
| Flyway Core / MySQL 模块 | 12.4.0 | Boot parent 管理 |
| Flyway Boot Starter | 4.1.2 | Boot parent 管理 |

没有重复引入其他 MyBatis Starter，也没有引入 JPA/Hibernate。Spring AI 2.0.2 继续仅导入 BOM，不激活模型服务。

依赖选择核对了 [Boot 4 数据库初始化说明](https://docs.spring.io/spring-boot/how-to/data-initialization.html)、[MyBatis-Plus Boot 4 Starter](https://baomidou.com/en/getting-started/)与[分页插件说明](https://baomidou.com/en/plugins/pagination/)，实际结果保存在 `roadmind-backend/target/phase3-dependency-tree.txt`。

## 数据库与迁移

开发数据库为 `roadmind`，独立测试数据库为 `roadmind_test`，字符集 `utf8mb4`、排序规则 `utf8mb4_0900_ai_ci`。一次性建库由 `scripts/initialize-databases.ps1` 执行，只创建这两个库，不清库、不改已有库的字符集。

表结构唯一来源：

[`V1__create_knowledge_base.sql`](../roadmind-backend/src/main/resources/db/migration/V1__create_knowledge_base.sql)

Flyway 在应用启动时校验并执行版本化迁移。`clean-disabled=true`、`baseline-on-migrate=false`，不自动接管没有迁移历史的已有表，不使用 `schema.sql` 或 ORM 自动建表。

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| id | BIGINT AUTO_INCREMENT | 主键；API 转为字符串 |
| name | VARCHAR(40) | 规范化名称，必填；有效记录全局唯一 |
| description | VARCHAR(160) | 非 null，可为空字符串 |
| category | VARCHAR(16) | 现有四种业务分类 |
| created_at | DATETIME(3) | UTC 创建时间 |
| updated_at | DATETIME(3) | UTC 更新时间，删除也会更新 |
| deleted | TINYINT | 0 正常、1 逻辑删除，CHECK 限制取值 |
| active_name | VARCHAR(40) 生成列 | deleted=0 时为 name，否则为 NULL，仅用于唯一约束 |

索引：

- `uk_kb_active_name(active_name)`：防止并发重名；删除记录为 NULL，可多次删除并重新创建同名知识库。避免 `(name, deleted)` 唯一索引只能保留一条同名删除记录的问题。
- `idx_kb_deleted_updated(deleted, updated_at, id)`：普通列表和稳定排序。
- `idx_kb_category_deleted_updated(category, deleted, updated_at, id)`：分类筛选及排序。

名称唯一性按数据库排序规则判断，英文大小写不敏感。关键词是名称包含匹配，任意子串不会因为普通 BTree 索引就变成高性能全文检索；当前不增加额外检索中间件。

## API 契约

统一前缀：`/api/knowledge-bases`。开发前端通过 Vite Proxy 请求，浏览器使用同源 `/api`，不增加无必要的跨域配置。

| 方法 | 路径 | 行为 | 正常状态 |
| --- | --- | --- | --- |
| GET | `/api/knowledge-bases` | 搜索、分类、分页查询未删除记录 | 200 |
| GET | `/api/knowledge-bases/{id}` | 查询有效知识库详情 | 200 |
| POST | `/api/knowledge-bases` | 创建元数据 | 201 |
| PUT | `/api/knowledge-bases/{id}` | 完整修改业务字段 | 200 |
| DELETE | `/api/knowledge-bases/{id}` | 逻辑删除 | 200 |

列表参数：

| 参数 | 默认值 | 校验与含义 |
| --- | --- | --- |
| page | 1 | 整数，至少 1 |
| size | 8 | 整数，1–100，持久层也限制最多 100 |
| keyword | 不筛选 | 可选，最多 40 字符；仅搜索名称，去除首尾空白 |
| category | 不筛选 | 可选；精确匹配下表业务值，空字符串等同不筛选 |

查询按 `updated_at DESC, id DESC` 排序。越界页返回空记录，`total` 保留当前筛选总数。`%`、`_`、`=` 按字面字符处理，查询使用绑定参数，不拼接用户 SQL。

| API 分类值 | 现有 UI 分类标签 |
| --- | --- |
| 日常养护 | 技术规范 |
| 设施管理 | 行业指南 |
| 应急安全 | 内部资料 |
| 作业管理 | 工程案例 |

创建与修改请求示例：

```json
{
  "name": "路面养护资料",
  "description": "日常巡查与养护工作的资料范围",
  "category": "日常养护"
}
```

名称、分类必填，去除首尾空白。描述最多 160 字符；省略或传 null 时规范化为空字符串。PUT 表示完整修改，省略描述会清空描述。请求不能设置数据库主键、时间、删除标记或用户身份。

成功详情示例（值仅用于说明契约）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "123",
    "name": "路面养护资料",
    "description": "日常巡查与养护工作的资料范围",
    "category": "日常养护",
    "documentCount": 0,
    "createdAt": "2026-10-26T00:00:00Z",
    "updatedAt": "2026-10-26T00:00:00Z"
  },
  "timestamp": "2026-10-26T00:00:00Z"
}
```

列表的 `data` 为 `{records, total, page, size}`。删除成功的 `data` 为 null。全部沿用现有 `ApiResponse`，错误也保留真实 HTTP 状态：

- 400：输入、分页或主键类型校验失败。
- 404：知识库不存在或已删除，包括重复删除。
- 409：有效知识库重名，包括数据库唯一约束捕获的竞争冲突。
- 503：数据访问失败，返回公开中文提示，不暴露 SQL、连接凭据或驱动错误。
- 500：其他未预期异常，继续沿用原有固定提示。

当前没有文档表，`documentCount` 为 0；不是将演示文档计入真实数量。时间以 UTC 存储和返回，前端按北京时间显示。

## 分层与文件

```text
Controller → KnowledgeBaseService → KnowledgeBaseServiceImpl → KnowledgeBaseMapper → MySQL
                              DTO / VO 隔离持久化 Entity
```

`knowledge/` 下使用 `controller / service / service.impl / mapper / entity / dto / vo`。事务、名称唯一性和实体映射位于 Service；Controller 不直接调用 Mapper。普通查询和删除由 MyBatis-Plus `@TableLogic` 统一处理。Service 的接口、实现关键流程与私有方法均提供中文注释。

前端 `api/knowledge-bases.ts` 访问真实接口；`KnowledgeRealView.vue` 独立管理真实记录、分页、请求取消和错误，不写入演示 workspace。`KnowledgeDemoView.vue` 保留原有演示逻辑，`KnowledgeView.vue` 只控制明确的数据来源切换。请求失败保持真实模式，不自动补入 Mock 记录。

## 本地启动

在后端目录准备 `.env.local`，可参考 `.env.example`。该文件由现有 `.gitignore` 忽略；密码不写入 YAML、代码或 Maven 命令参数。脚本只设置当前 PowerShell 与子进程的环境变量，不修改用户/系统环境配置。

```dotenv
ROADMIND_DB_URL=jdbc:mysql://127.0.0.1:3306/roadmind?connectionTimeZone=UTC
ROADMIND_DB_USERNAME=填写本机账户
ROADMIND_DB_PASSWORD=填写本机密码
ROADMIND_TEST_DB_URL=jdbc:mysql://127.0.0.1:3306/roadmind_test?connectionTimeZone=UTC
```

```powershell
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-backend'
.\scripts\initialize-databases.ps1
.\scripts\test-backend.ps1 -Package
.\scripts\start-backend.ps1 -Jar
```

也可以在已经提供环境变量的 PowerShell 中直接执行 `mvn verify` / `mvn spring-boot:run`。Spring Boot 本身不隐式读取任意 `.env.local`，本项目由启动脚本显式加载。

前端：

```powershell
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-frontend'
npm run dev
```

打开 [真实知识库页面](http://127.0.0.1:5173/knowledge)，数据来源选择“真实数据（MySQL）”。“演示数据（Mock）”单独保留旧版体验。

本轮实际验证见[第三阶段验收记录](phase3-verification.md)。