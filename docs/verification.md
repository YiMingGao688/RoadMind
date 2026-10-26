# 第一阶段验证记录

验证时间：2026-10-26 10:55:40 +08:00（Asia/Shanghai）。本文件只在桌面项目构建、测试和 HTTP 检查全部成功后生成。

## 环境与范围

- 项目：`C:\Users\31603\Desktop\RoadMind V1.0`。
- JDK：Eclipse Temurin 21.0.12.1；Maven：3.9.12。
- Git 检查：目标目录不在 Git 仓库中。未执行初始化、提交或推送。
- 原有 `.gitignore` 保持不变；README 修改前校验了原始 SHA-256，后端和 docs 写入前均为空。
- 本阶段未安装或启动数据库、Redis、Milvus、MinIO、RabbitMQ 或模型服务；前端未开发。

## 实际使用的依赖

| 组件 | 实际版本 | 依据 |
| --- | --- | --- |
| Spring Boot 与各 Boot starter | 4.1.2 | Maven effective POM 与依赖树 |
| Spring Framework | 7.0.10 | Boot 管理的实际依赖树 |
| Jackson Databind | 3.1.7 | `tools.jackson.core` 依赖树 |
| Lombok | 1.18.48 | Boot 管理的实际依赖树 |
| JUnit Jupiter | 6.0.3 | Boot 测试 starter 的依赖树 |
| Spring AI | 2.0.2 | BOM 导入成功；临时 POM 解析 `spring-ai-model` |
| MyBatis-Plus | 3.5.17 | 临时 POM 解析 `mybatis-plus-spring-boot4-starter` |

Spring AI 与 MyBatis-Plus 仅存在于正式项目的版本管理中。临时 POM 复制实际 POM 的 Boot parent、版本属性、依赖管理及基础依赖，再加入 AI model 与 MyBatis-Plus Boot 4 starter，验证组合依赖能够解析。它未进入正式源码或运行时依赖，不等于已完成模型调用或 MySQL 集成测试。

## 已执行的命令

以下保留实际 Maven 路径、仓库参数及构建目标，省略仅用于捕获输出的 `-l` 日志参数。没有更改系统环境变量或用户 Maven 配置。

```powershell
$maven = 'D:\apache-maven-3.9.12\bin\mvn.cmd'
$cache = 'C:\Users\31603\.codex\visualizations\2026\10\26\01a17601-4895-7130-976e-5fac9f6e13ef\maven-repository'
$probe = 'C:\Users\31603\.codex\visualizations\2026\10\26\01a17601-4895-7130-976e-5fac9f6e13ef\roadmind-phase1\compatibility-check\pom.xml'

java -version
javac -version
mvn -version
git -C 'C:\Users\31603\Desktop\RoadMind V1.0' status --short

# 在独立临时 POM 中检查未来依赖，未启用数据库或 AI 自动配置。
& $maven -B -ntp "-Dmaven.repo.local=$cache" -f $probe dependency:resolve dependency:tree help:effective-pom '-DoutputFile=target/dependency-tree.txt' '-Doutput=target/effective-pom.xml'

# 在最终桌面路径执行完整构建、测试与依赖检查。
Set-Location 'C:\Users\31603\Desktop\RoadMind V1.0\roadmind-backend'
& $maven -B -ntp "-Dmaven.repo.local=$cache" clean verify org.apache.maven.plugins:maven-dependency-plugin:3.10.0:tree org.apache.maven.plugins:maven-help-plugin:3.5.2:effective-pom '-DoutputFile=target/dependency-tree.txt' '-Doutput=target/effective-pom.xml'

# 验证时通过 Start-Process 在后台启动；实际 Java 启动参数如下。
java -jar .\target\roadmind-backend-1.0.0-SNAPSHOT.jar --server.port=8080
Invoke-WebRequest 'http://localhost:8080/api/health'
Invoke-WebRequest 'http://localhost:8080/actuator/health'
```

Maven 使用独立的可写缓存；无需将该缓存提交或复制进项目。上面的依赖插件版本来自本次实际解析结果，没有在项目中覆盖 Boot 管理的插件版本。

## 测试与启动结果

- 独立编写目录首次 `clean verify`：13 项测试通过。
- 最终桌面目录：`BUILD SUCCESS`，13 项测试，失败 0，错误 0，跳过 0。
- 健康检查测试 3 项，覆盖统一业务响应、Actuator 标准响应及 env 端点未公开。
- 异常处理测试 10 项，覆盖有效 / 无效请求体、JSON 解析、方法参数校验、缺失参数、类型错误、404、405、内部错误隐藏及返回值校验错误。
- 可执行 JAR 已在最终路径构建并启动；验证时 PID 为 43276，端口为 8080。
- `/api/health`：HTTP 200，应用名称为 `roadmind-backend`，状态为 `UP`。
- `/actuator/health`：HTTP 200，状态为 `UP`，不包含组件详情。
- 测试专用路由 `/test/errors/unexpected`：HTTP 404，确认测试 Controller 未进入运行应用。
- 正式依赖树中没有 Spring AI、MyBatis-Plus、数据库驱动等未启用模块；JAR 不包含测试 Controller。

健康接口实际响应：

```json
{"code":0,"message":"success","data":{"application":"roadmind-backend","status":"UP"},"timestamp":"2026-10-26T02:55:40.251780200Z"}
```

运行地址：<http://localhost:8080/api/health>。这是 JSON 接口，尚无前端页面。PID 为验证时快照，应用关闭后不能据此判断仍在运行。

## 检查记录位置

- 完整构建日志：`roadmind-backend/target/verification/verify.log`。
- 测试报告：`roadmind-backend/target/surefire-reports/`。
- 正式依赖树：`roadmind-backend/target/dependency-tree.txt`。
- 正式 effective POM：`roadmind-backend/target/effective-pom.xml`。
- 临时组合 POM、依赖树与日志：`roadmind-backend/target/verification/compatibility-*`。
- 启动日志与实际响应：`roadmind-backend/target/verification/application.*.log`、`api-health.json`、`actuator-health.json`。

这些文件为本地验证产物，已由现有 `.gitignore` 的 `target` 规则忽略；下次 `mvn clean` 会清理它们。

## 已知限制与环境记录

- 沙箱内直接执行 Maven 时收到 `Access is denied`，获得系统授权后编译和验证成功，不是 JDK 或 Maven 缺失。
- 临时依赖检查时，本机现有 HTTP Maven 镜像的部分插件组元数据缺少校验和，产生非阻断警告；实际依赖解析与构建成功。最终检查使用已解析出的完整插件坐标，无需依赖该前缀扫描。未修改镜像、关闭 TLS 校验或放宽校验策略。
- 首次 HTTP 验收脚本未解码 PowerShell 返回的 Actuator vendor JSON 字节数组，导致误判。补充 UTF-8 解码后，使用同一运行进程完成检查；后端源码无需修改，也未重复执行已通过的测试。
- 当前没有阻止基础后端启动的未解决问题；AI 模型、持久层、中间件、权限与前端功能均仍属于后续阶段，尚未完成集成验收。
