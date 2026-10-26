package com.roadmind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * RoadMind 模块化单体应用入口，统一扫描 com.roadmind 下的功能模块。
 */
@SpringBootApplication
public class RoadMindApplication {

    /**
     * 启动知识库后端，使用环境变量连接 MySQL 并由 Flyway 验证和迁移表结构。
     *
     * @param args Spring Boot 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(RoadMindApplication.class, args);
    }
}
