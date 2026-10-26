package com.roadmind.health.vo;

/**
 * 应用存活检查结果，仅反映本进程的 HTTP 服务能力。
 *
 * @param application 配置中的应用名称，便于调用方识别服务
 * @param status 存活状态，本接口正常处理请求时为 UP
 */
public record HealthVO(String application, String status) {
}
