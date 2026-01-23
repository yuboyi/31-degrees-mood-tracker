package com.degrees31.aiplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 通用API响应DTO
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    /**
     * 响应状态码
     */
    private Integer code;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 响应数据
     */
    private T data;

    /**
     * 响应时间戳
     */
    private LocalDateTime timestamp;

    /**
     * 请求追踪ID（可选）
     */
    private String traceId;

    // 状态码常量
    public static final int SUCCESS = 200;
    public static final int BAD_REQUEST = 400;
    public static final int UNAUTHORIZED = 401;
    public static final int FORBIDDEN = 403;
    public static final int NOT_FOUND = 404;
    public static final int INTERNAL_ERROR = 500;

    /**
     * 成功响应
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(SUCCESS)
                .message("操作成功")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 成功响应（自定义消息）
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .code(SUCCESS)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 失败响应
     */
    public static <T> ApiResponse<T> error(Integer code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 失败响应（默认500错误）
     */
    public static <T> ApiResponse<T> error(String message) {
        return error(INTERNAL_ERROR, message);
    }

    /**
     * 参数错误响应
     */
    public static <T> ApiResponse<T> badRequest(String message) {
        return error(BAD_REQUEST, message);
    }

    /**
     * 未授权响应
     */
    public static <T> ApiResponse<T> unauthorized(String message) {
        return error(UNAUTHORIZED, message);
    }

    /**
     * 禁止访问响应
     */
    public static <T> ApiResponse<T> forbidden(String message) {
        return error(FORBIDDEN, message);
    }

    /**
     * 资源未找到响应
     */
    public static <T> ApiResponse<T> notFound(String message) {
        return error(NOT_FOUND, message);
    }

    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return SUCCESS == code;
    }

    /**
     * 设置追踪ID
     */
    public ApiResponse<T> withTraceId(String traceId) {
        this.traceId = traceId;
        return this;
    }
}