package com.roadmind.support;

import java.net.URI;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * 全上下文测试统一使用独立 MySQL 库；在上下文刷新和 Flyway 执行前拒绝开发库地址。
 * 密码仅从当前进程环境获取，不写入测试代码、Maven 参数或版本库。
 */
public abstract class MySqlIntegrationTestSupport {
    /**
     * 覆盖应用数据源；仅允许 roadmind_test 或其带下划线后缀的隔离数据库。
     * 测试账户可单独配置，否则复用启动环境中的开发账户。
     *
     * @param registry Spring 测试属性注册表
     */
    @DynamicPropertySource
    static void testDataSource(DynamicPropertyRegistry registry) {
        String url = environment("ROADMIND_TEST_DB_URL",
                "jdbc:mysql://127.0.0.1:3306/roadmind_test?connectionTimeZone=UTC");
        if (!url.startsWith("jdbc:mysql://")) throw new IllegalStateException("测试数据源必须为 MySQL");
        URI address = URI.create(url.substring(5));
        if (!address.getPath().matches("/roadmind_test(?:_[A-Za-z0-9]+)*")) {
            throw new IllegalStateException("测试数据源只能指向独立的 roadmind_test 数据库");
        }
        String username = environment("ROADMIND_TEST_DB_USERNAME", environment("ROADMIND_DB_USERNAME", ""));
        String password = environment("ROADMIND_TEST_DB_PASSWORD", environment("ROADMIND_DB_PASSWORD", ""));
        if (username.isBlank() || password.isBlank()) {
            throw new IllegalStateException("请为独立测试数据库配置 ROADMIND_TEST_DB_USERNAME / PASSWORD 或 ROADMIND_DB_USERNAME / PASSWORD");
        }
        registry.add("spring.datasource.url", () -> url);
        registry.add("spring.datasource.username", () -> username);
        registry.add("spring.datasource.password", () -> password);
    }

    /** 环境变量为空时使用明确的非敏感默认值，不记录实际凭据。 */
    private static String environment(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }
}
