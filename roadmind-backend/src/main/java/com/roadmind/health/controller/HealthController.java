package com.roadmind.health.controller;

import com.roadmind.common.api.ApiResponse;
import com.roadmind.health.vo.HealthVO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 提供业务 API 形式的进程存活检查，不访问外部中间件。
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    /** 从 Spring 配置读取的应用名称，用于识别健康响应所属服务。 */
    private final String applicationName;

    /**
     * 注入应用标识，避免在接口中重复维护应用名称。
     *
     * @param applicationName spring.application.name 配置值
     */
    public HealthController(@Value("${spring.application.name}") String applicationName) {
        this.applicationName = applicationName;
    }

    /**
     * 返回应用已能处理 HTTP 请求的状态，不表示数据库或模型服务已经可用。
     *
     * @return 包含应用名称和 UP 状态的统一成功响应
     */
    @GetMapping
    public ApiResponse<HealthVO> health() {
        return ApiResponse.success(new HealthVO(applicationName, "UP"));
    }
}
