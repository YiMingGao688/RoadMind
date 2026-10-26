# RoadMind 整体架构设计

## 当前范围

RoadMind 采用 Java 21、Spring Boot 4.1.2、Maven 的模块化单体后端和 Vue 3 前端，不拆分微服务。本阶段实现知识库元数据的 MySQL 持久化与前后端闭环；文档、RAG、Agent 和交通业务尚未接入真实服务。

## 当前请求链

```text
Vue 真实知识库 → Axios /api → Vite Proxy → KnowledgeBaseController
                                          → KnowledgeBaseService
                                          → KnowledgeBaseServiceImpl（事务与业务规则）
                                          → KnowledgeBaseMapper → MySQL

迁移：应用启动 → Flyway 校验版本 → V1__create_knowledge_base.sql

业务健康：HealthController → ApiResponse<HealthVO>
运维健康：Spring Boot Actuator → 标准 health 响应（含实际数据源检查）
错误：GlobalExceptionHandler → 保留真实 HTTP 状态的统一错误响应
```

业务 API 沿用 `code / message / data / timestamp`，成功码为 0，错误保留实际 HTTP 状态；Actuator 保留标准格式。`timestamp` 为 UTC。

## 模块边界

| 包 | 当前内容 | 后续职责 |
| --- | --- | --- |
| `common.api` | ApiResponse、PageResponse | 公共 API 契约 |
| `common.exception` | 全局异常、BusinessException | 框架错误和业务错误分类 |
| `common.config` | MyBatis-Plus 分页配置 | 最小必要的工程配置 |
| `health` | Controller、VO | 进程存活检查 |
| `knowledge` | Controller / Service / Mapper / Entity / DTO / VO | 当前知识库元数据，后续文档与入库流水线 |
| `rag` | 仅包边界 | 检索、重排、上下文与引用 |
| `agent` | 仅包边界 | 工具注册、调用编排和执行约束 |
| `traffic` | 仅包边界 | 病害、事件和巡检设备业务查询 |

Controller 不访问 Mapper。Service 负责事务、名称冲突、资源存在性和实体映射。Mapper 继续采用 MyBatis-Plus，不引入 JPA/Hibernate。健康接口没有业务查询，继续保持简单，不添加空 Service。

未来模块之间通过明确 Service 边界调用，不跨模块直接访问 Mapper；common 不依赖业务模块。

## 数据与迁移

- 业务数据库 `roadmind`，独立测试库 `roadmind_test`，使用 utf8mb4。
- `kb_knowledge_base` 保存名称、描述、分类、UTC 时间与逻辑删除标记。
- 有效名称通过生成列唯一索引保证，删除后允许重建同名知识库。
- 列表和详情自动排除逻辑删除记录，分页按更新时间、ID 倒序稳定排序。
- 单页最大 100 条，名称关键词使用绑定参数并转义通配字符。
- SQL 由 Flyway 版本化迁移，不通过手工建表或 ORM 自动生成 schema。
- 主键对外为字符串，DTO/VO 不暴露 Entity 和内部生成列。
- 当前没有用户、权限或文档表，不伪造用户 ID，也不填充演示文档数。

完整表设计与 API 契约见[知识库接口设计](knowledge-base-api.md)。

## 前端数据边界

保留六页 AI 原生设计，只为知识库加入真实来源和分页/错误状态。

- `KnowledgeView` 选择来源，默认真实数据；用户可以显式切换到 Mock。
- `KnowledgeRealView` 调用 `api/knowledge-bases.ts`，使用独立真实记录状态。
- `KnowledgeDemoView` 保留原有效 Mock 流程，继续使用演示 workspace。
- 实际 API 失败显示错误与重试，不自动降级或填入演示记录。
- 文档数量暂为 0；真实详情不展示 Mock 文档或本地登记入口。
- 首页、AI 会话、知识探索、养护模板和 RAG 分数/耗时继续明确标记演示。

真实元数据写入 MySQL 后刷新仍保留；Mock 状态刷新恢复初始样本。前端 `VITE_` 变量只配置公开服务地址，数据库与模型凭据留在后端。

## 校验与错误

Spring MVC / Jakarta Validation 负责请求体及方法参数校验，不额外注册校验器或在 Controller 上重复使用类级 `@Validated`。

全局异常仍继承 `ResponseEntityExceptionHandler`，保留 400、404、405、Allow 等协议语义。新增业务资源不存在为 404、名称冲突为 409、数据访问失败为 503；未预期异常保持 500，隐藏 SQL、凭据和内部异常信息。

Service 接口及关键实现、私有方法、DTO/VO 字段含中文注释；注释只说明当前真实业务，不把后续功能写成已实现。

## 配置、启动与测试

`application.yml` 从 `ROADMIND_DB_URL / USERNAME / PASSWORD` 读取连接配置。开发脚本显式加载被忽略的 `.env.local`，只作用于当前进程，不修改用户或系统环境。Flyway 禁止 clean 与自动 baseline；不关闭数据源自动配置来绕过连接问题。

Maven 全上下文测试通过共享测试基类覆盖数据源，仅允许 `roadmind_test` 或其隔离后缀库，拒绝指向开发数据库。知识库集成测试使用真实 MySQL 并事务回滚，不使用 H2 冒充 MySQL。

浏览器真实 API 回归使用 5174 → 8081 → roadmind_test，开发地址保持 5173 → 8080 → roadmind。测试只清理自身创建的 ID，不清表、不改迁移历史。

实际命令与结果见[第三阶段验证](phase3-verification.md)。第一阶段的历史记录保留在[基础工程验证](verification.md)，六页参考与历史截图保留在[前端六页记录](frontend-six-page-verification.md)。

## 后续架构

- 文档：知识库关联文档元数据、MinIO 原文件、PDF/Word 解析与任务状态。
- RAG：按模块接入 Spring AI 2.0.2、Embedding、Milvus、混合检索和 Rerank。
- Agent：受参数和权限校验约束的只读业务 Tool Calling。
- Redis / RabbitMQ：仅在实际缓存、异步任务和恢复需求出现时加入。
- Spring Security、审计、Docker/Nginx/Linux：后续部署阶段实现。

当前不引入 Spring AI Alibaba，不激活模型服务，不增加无人机或硬件功能。

## 版本依据

Boot 4 的模块化 Starter、Spring AI BOM 及 MyBatis-Plus Boot 4 依赖体系继续沿用已确认的版本。Flyway、Connector/J 由 Boot 统一管理，分页插件与 MyBatis-Plus 同版本。

参考 [Spring Boot 数据初始化](https://docs.spring.io/spring-boot/how-to/data-initialization.html)、[MyBatis-Plus Boot 4](https://baomidou.com/en/getting-started/)、[分页插件](https://baomidou.com/en/plugins/pagination/)及[Spring AI 接入说明](https://docs.spring.io/spring-ai/reference/getting-started.html)。具体解析版本以本轮 Maven 依赖树及[接口设计中的版本表](knowledge-base-api.md#版本与依赖)为准。