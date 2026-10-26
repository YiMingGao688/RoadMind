package com.roadmind.common.api;

import java.time.Instant;

/**
 * 业务 API 的统一响应；成功时 code 为 0，基础工程错误使用对应 HTTP 状态码。
 * 错误响应仍保留真实 HTTP 状态，便于客户端和监控区分请求失败类型。
 *
 * @param code 业务结果码，0 表示成功
 * @param message 面向调用方的结果说明，错误时不包含内部异常详情
 * @param data 业务数据，错误时为 null
 * @param timestamp 服务端生成响应的 UTC 时间
 * @param <T> 业务数据类型
 */
public record ApiResponse<T>(int code, String message, T data, Instant timestamp) {

    /**
     * 将业务数据包装为成功响应。
     *
     * @param data 业务处理结果
     * @param <T> 业务数据类型
     * @return 结果码为 0 的响应
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "success", data, Instant.now());
    }

    /**
     * 生成不携带业务数据的错误响应，由调用方同步设置 HTTP 状态。
     *
     * @param code 错误结果码
     * @param message 可公开的错误说明
     * @return data 为 null 的错误响应
     */
    public static ApiResponse<Void> failure(int code, String message) {
        return new ApiResponse<>(code, message, null, Instant.now());
    }
}
