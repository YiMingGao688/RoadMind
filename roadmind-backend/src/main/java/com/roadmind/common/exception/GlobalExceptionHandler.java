package com.roadmind.common.exception;

import com.roadmind.common.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * 将 Spring MVC 参数错误、路由错误和未知异常转换为统一响应。
 * 保留框架确定的 HTTP 状态和 Allow 等响应头，避免将 404、405 等错误误报为 500。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /** 服务端错误的公开提示，不将异常消息或堆栈返回给调用方。 */
    private static final String INTERNAL_ERROR_MESSAGE = "服务器内部错误，请稍后重试";

    /**
     * 返回业务层确认的公开错误，同时保留实际 HTTP 状态。
     *
     * @param ex 明确分类的业务异常
     * @return 业务错误状态和统一响应
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.failure(ex.getStatus().value(), ex.getMessage()));
    }

    /**
     * 数据访问失败仅公开稳定提示，避免把连接信息、SQL 或驱动异常发给浏览器。
     *
     * @param ex Spring 转换后的数据访问异常
     * @param request 仅用于记录请求方法和路径
     * @return HTTP 503 及可安全展示的错误说明
     */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataAccessException(DataAccessException ex, HttpServletRequest request) {
        log.error("Database request failure: {} {}", request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.failure(503, "数据库服务暂不可用，请稍后重试"));
    }

    /**
     * 统一包装框架异常；请求体校验错误展示约束提示，服务端错误记录堆栈并隐藏细节。
     * 继续调用父类以保留响应已提交检查及框架错误上下文。
     *
     * @param ex Spring MVC 捕获的异常
     * @param body 框架原始响应体，由统一响应替代
     * @param headers 框架设置的响应头
     * @param statusCode 框架判定的 HTTP 状态码
     * @param request 当前请求上下文
     * @return 统一错误响应；响应已提交时按框架规则返回 null
     */
    @Override
    protected @Nullable ResponseEntity<Object> handleExceptionInternal(
            Exception ex, @Nullable Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {
        String message = publicMessage(statusCode);
        if (statusCode.is5xxServerError()) {
            log.error("Framework request failure: {}", request.getDescription(false), ex);
        } else if (ex instanceof MethodArgumentNotValidException validationException) {
            String validationMessage = validationException.getBindingResult().getAllErrors().stream()
                    .map(DefaultMessageSourceResolvable::getDefaultMessage)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.joining("；"));
            if (!validationMessage.isBlank()) {
                message = validationMessage;
            }
        }
        return super.handleExceptionInternal(
                ex, ApiResponse.failure(statusCode.value(), message), headers, statusCode, request);
    }

    /**
     * 兜底处理未被 Spring MVC 分类的异常，保留服务端日志并返回固定的 500 提示。
     *
     * @param ex 未预期的内部异常
     * @param request 当前 HTTP 请求，仅将方法和路径用于日志定位
     * @return HTTP 500 及不含内部详情的统一响应
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(
            Exception ex, HttpServletRequest request) {
        log.error("Unhandled request failure: {} {}", request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure(HttpStatus.INTERNAL_SERVER_ERROR.value(), INTERNAL_ERROR_MESSAGE));
    }

    /**
     * 根据框架状态返回稳定提示，不透传可能包含请求内容或内部路径的原始异常消息。
     *
     * @param statusCode 实际 HTTP 状态
     * @return 可公开的错误说明
     */
    private String publicMessage(HttpStatusCode statusCode) {
        if (statusCode.is5xxServerError()) {
            return INTERNAL_ERROR_MESSAGE;
        }
        return switch (statusCode.value()) {
            case 400 -> "请求参数不合法";
            case 404 -> "请求的资源不存在";
            case 405 -> "请求方法不支持";
            case 406 -> "不支持请求的响应格式";
            case 415 -> "请求内容类型不支持";
            default -> "请求处理失败";
        };
    }
}
