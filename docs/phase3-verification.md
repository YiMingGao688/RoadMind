# 第三阶段验收：MySQL 知识库管理闭环

验证日期：2026-10-26。工程位置：`C:\Users\31603\Desktop\RoadMind V1.0`。

## 交付范围

本阶段完成真实知识库元数据闭环：创建、列表/名称/分类/分页查询、详情、修改、逻辑删除，以及前端真实 Axios 联调。保留原有六页设计，保留独立 Mock 模式，不接入文档存储、模型、Milvus、Redis、MinIO 或 Agent。

[完整表设计、版本与 API 契约](knowledge-base-api.md)；[Flyway V1 迁移](../roadmind-backend/src/main/resources/db/migration/V1__create_knowledge_base.sql)。

## 检查与环境

- 初次检查时 MySQL 8.0.35 已安装但服务停止；用户启动服务后验证 3306 可监听。
- 从用户本机后端 `.env.local` 读取配置，以真实 MySQL 客户端连接确认 `root@localhost` 和服务器 8.0.35；没有输出密码。
- 此前不存在 `roadmind` / `roadmind_test`，只创建了这两个 utf8mb4 数据库，没有修改其他数据库。
- 后端 Java 21.0.12.1、Maven 3.9.12；前端 Node 24.15.0、npm 11.12.1、Edge 156.0.4314.42。
- MyBatis-Plus Boot 4 Starter 3.5.17、Connector/J 9.7.0、Flyway 12.4.0 实际解析与运行成功。后两者由 Boot 4.1.2 管理。
- MySQL 8.4 为兼容目标；本轮实际实例为 8.0.35，没有把 8.4 宣称为已实机验证。
- 项目尚未初始化 Git；未执行初始化、commit 或 push。比较了修改前的源码备份，未重写其他五个业务页面。

## 开发与测试隔离

| 用途 | 前端 | 后端 | MySQL 数据库 |
| --- | --- | --- | --- |
| 开发使用 | 5173 | 8080 | roadmind |
| 浏览器真实 API 自动化与截图 | 5174 | 8081 | roadmind_test |
| Maven 全上下文测试 | MockMvc | 测试上下文 | roadmind_test |

Maven 测试基类在启动上下文与迁移前限制数据库名，只允许 `roadmind_test` 或隔离后缀。新增知识库集成用例使用真实 MySQL，业务测试行事务回滚，不使用 H2 替代。浏览器用例仅通过 API 逻辑删除自身创建的 ID，不清表、不修改迁移历史。开发库没有写入自动化测试记录。

## 实际命令

后端：

```powershell
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-backend'
.\scripts\initialize-databases.ps1
. .\scripts\Import-LocalEnvironment.ps1
Import-RoadMindEnvironment
mvn -B -ntp test
mvn -B -ntp verify
mvn -B -ntp org.apache.maven.plugins:maven-dependency-plugin:3.10.0:tree
.\scripts\start-backend.ps1 -Jar
```

实际执行还使用 `-l target/phase3-*.log` 与 `-DoutputFile=target/phase3-dependency-tree.txt` 保存输出。初始未修改时的 13 项测试先通过；新增持久层后再运行完整测试。重新打包 JAR 前停止的是本项目旧后端，不涉及其他 Java 服务。

独立浏览器测试后端在另一个窗口启动：

```powershell
.\scripts\start-backend.ps1 -Jar -TestDatabase
```

前端：

```powershell
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-frontend'
npm run typecheck
npm run build
npm run test:e2e
npm run test:e2e:api
```

`test:e2e:api` 自动使用独立 5174 前端和 8081 代理目标。原有 `test:e2e` 明确进入 Mock 模式，不因真实数据库状态改变演示测试结果。

## 最终验证结果

| 验证 | 结果 |
| --- | --- |
| MySQL 连接 | 成功，实际服务器 8.0.35 |
| Flyway | 两个库均成功应用并校验 V1，schema history 的 success=1 |
| Maven | **23 项通过，0 失败，0 错误，0 跳过**；包含原有 13 项和新增 10 项知识库集成测试 |
| Maven verify | 成功，已生成可运行 Spring Boot JAR |
| 依赖树 | 仅使用 MyBatis-Plus Boot 4 Starter，无不兼容 MyBatis Starter 或 JPA |
| 原有前端演示 | **17 / 17 通过** |
| 真实 API 浏览器 | **7 / 7 通过** |
| TypeScript | 应用、Vite、两份 Playwright 配置和测试代码检查通过 |
| 生产构建 | `npm run build` 成功 |
| HTTP | 开发 8080 健康检查成功；5173 的 `/api/knowledge-bases` 代理返回真实分页结构 |
| 浏览器实际渲染 | 1440×900、1920×1080、390×844 检查通过，没有横向溢出；最终截图检查控制台错误和失败请求均为 0 |
| 数据刷新 | UI 创建后浏览器刷新仍可读取同一主键；编辑结果与服务端详情一致 |
| 后端重启 | 重启 8081 的测试后端后，同一记录与时间、名称、描述保持一致 |
| 删除 | API 逻辑删除后普通查询为 404，SQL 仍可看到 deleted=1 的物理行 |
| 数据隔离 | 真实文档数为 0，真实列表未混入 Mock 卡片/文档，API 错误不会自动回退 Mock |

后端测试报告在 `roadmind-backend/target/surefire-reports/`。浏览器报告分别在 `playwright-report/` 与 `playwright-report-api/`；运行产物均已被 Git 忽略。

一次接口错误状态测试通过浏览器拦截返回 503，验证的是客户端公开错误与重试交互；没有停止本机 MySQL 服务来制造故障。模式切换用例等待真实 GET 完成后再验证列表，避免把请求尚在加载误判为数据丢失。

## MySQL 持久化证据

在 `roadmind_test` 创建实际记录，SQL 核对后端返回的主键、名称、分类和 deleted=0，再停止并重启测试后端，使用相同主键重新读取，字段和创建时间一致。最后通过 DELETE 清理，SQL 确认该行 deleted=1；开发库业务行数仍为 0。

- [重启前后响应比对](phase3/persistence-verification.json)
- [数据库行、迁移历史与索引检查](phase3/database-verification.tsv)
- [浏览器请求与视口检查](phase3/browser-verification.json)

证据文件不包含密码。截图另使用独立测试库中的实际界面验收记录；拍摄完成后也通过 API 逻辑删除，不向开发库加入样本数据。

## 实际截图

截图在浏览器完成渲染和弹窗动画后获取，没有用生成式图片工具修改 UI。

| 场景 | 截图 |
| --- | --- |
| 真实列表 1440×900 | [查看](phase3/screenshots/knowledge-real-1440.png) |
| 真实列表 1920×1080 | [查看](phase3/screenshots/knowledge-real-1920.png) |
| 手机 390×844 | [查看](phase3/screenshots/knowledge-real-390.png) |
| 创建弹窗 | [查看](phase3/screenshots/knowledge-create.png) |
| 编辑弹窗 | [查看](phase3/screenshots/knowledge-edit.png) |
| 真实详情、0 文档 | [查看](phase3/screenshots/knowledge-detail.png) |

## 文件与影响范围

- 后端 `knowledge/`：Controller、Service、ServiceImpl、Mapper、Entity、创建/修改 Request、VO。
- 公共层：PageResponse、BusinessException、分页插件、全局业务/数据异常处理，保持原有 HTTP 错误语义。
- 配置/迁移：环境变量数据源、Flyway 设置、V1 SQL、必要 Maven 依赖及 `.env.example`。
- 脚本：本地环境加载、建库、开发/JAR 启动、独立测试库启动、测试与打包。
- 前端：真实 API/类型、来源选择 Store、真实/演示视图分离、复用创建编辑弹窗和照片卡片、分页/加载/错误样式。
- 原有五个非知识库页面源码保持不变，只在共享布局中准确标记知识库的当前来源。

## 尚未接入与下一阶段

当前仍为 Mock：AI 回答与引用、知识探索资料及正文、养护分析、案例、RAG 召回与重排分数/耗时、独立演示模式的文档登记。没有真实上传、解析、切片、Embedding、向量检索或模型调用。

下一阶段建议先实现文档元数据、与知识库的关联、MinIO 上传和实际状态流转，再按真实 PDF/Word 样本选择解析方式。真实文档业务完成后才增加计数与入库状态，不提前扩展 Agent 或 RAG。

本阶段没有未解决的编译、构建或测试失败。登录权限、审计和正式部署属于后续范围；此阶段不将本地开发闭环描述为已完成生产上线。
最终保留：MySQL 3306、开发后端 8080、开发前端 5173。临时测试后端 8081 和测试前端 5174 已停止；开发页面返回 HTTP 200，后端健康状态 UP，代理列表 code=0。
