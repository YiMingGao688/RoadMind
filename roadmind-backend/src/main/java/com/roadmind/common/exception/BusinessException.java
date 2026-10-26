package com.roadmind.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** 明确可公开的业务失败，不携带 SQL、凭据或内部堆栈内容作为响应消息。 */
@Getter
public class BusinessException extends RuntimeException {
    /** 同时用于实际 HTTP 状态和统一响应中的业务错误码。 */
    private final HttpStatus status;

    /**
     * 创建可由全局异常处理器直接对外展示的业务异常。
     *
     * @param status 业务对应的 HTTP 错误状态
     * @param message 经业务层确定、可公开的中文提示
     */
    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
}
