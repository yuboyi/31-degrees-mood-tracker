package com.degrees31.aiplatform.config;

import com.degrees31.aiplatform.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 参数验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleValidationException(MethodArgumentNotValidException e, HttpServletRequest request) {
        log.warn("参数验证失败，URI: {}", request.getRequestURI(), e);
        
        BindingResult bindingResult = e.getBindingResult();
        String message = bindingResult.getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        return ApiResponse.badRequest("参数验证失败: " + message);
    }

    /**
     * 约束违反异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleConstraintViolationException(ConstraintViolationException e, HttpServletRequest request) {
        log.warn("约束验证失败，URI: {}", request.getRequestURI(), e);
        
        String message = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));
        
        return ApiResponse.badRequest("参数验证失败: " + message);
    }

    /**
     * 参数类型不匹配异常
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleTypeMismatchException(MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        log.warn("参数类型不匹配，URI: {}, 参数: {}", request.getRequestURI(), e.getName(), e);
        
        String message = String.format("参数 '%s' 的值 '%s' 无效，期望类型: %s", 
                e.getName(), e.getValue(), e.getRequiredType().getSimpleName());
        
        return ApiResponse.badRequest(message);
    }

    /**
     * 运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleRuntimeException(RuntimeException e, HttpServletRequest request) {
        log.error("运行时异常，URI: {}", request.getRequestURI(), e);
        
        // 生产环境中不应该暴露详细的错误信息
        String message = "系统内部错误";
        if (e.getMessage() != null && !e.getMessage().isEmpty()) {
            // 可以根据需要决定是否暴露错误消息
            message = e.getMessage();
        }
        
        return ApiResponse.error(message);
    }

    /**
     * 空指针异常
     */
    @ExceptionHandler(NullPointerException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleNullPointerException(NullPointerException e, HttpServletRequest request) {
        log.error("空指针异常，URI: {}", request.getRequestURI(), e);
        return ApiResponse.error("系统内部错误：空指针异常");
    }

    /**
     * 非法参数异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgumentException(IllegalArgumentException e, HttpServletRequest request) {
        log.warn("非法参数异常，URI: {}", request.getRequestURI(), e);
        return ApiResponse.badRequest("参数错误: " + e.getMessage());
    }

    /**
     * 非法状态异常
     */
    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleIllegalStateException(IllegalStateException e, HttpServletRequest request) {
        log.warn("非法状态异常，URI: {}", request.getRequestURI(), e);
        return ApiResponse.error(409, "状态错误: " + e.getMessage());
    }

    /**
     * 通用异常处理
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception e, HttpServletRequest request) {
        log.error("未处理的异常，URI: {}", request.getRequestURI(), e);
        return ApiResponse.error("系统内部错误，请联系管理员");
    }

    /**
     * JWT相关异常（如果需要特殊处理）
     */
    @ExceptionHandler(io.jsonwebtoken.JwtException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleJwtException(io.jsonwebtoken.JwtException e, HttpServletRequest request) {
        log.warn("JWT异常，URI: {}", request.getRequestURI(), e);
        return ApiResponse.unauthorized("认证令牌无效: " + e.getMessage());
    }

    /**
     * 数据库相关异常
     */
    @ExceptionHandler({
            org.springframework.dao.DataAccessException.class,
            org.springframework.dao.DataIntegrityViolationException.class
    })
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleDataAccessException(Exception e, HttpServletRequest request) {
        log.error("数据库访问异常，URI: {}", request.getRequestURI(), e);
        
        String message = "数据操作失败";
        if (e instanceof org.springframework.dao.DataIntegrityViolationException) {
            message = "数据完整性约束违反，请检查输入数据";
        }
        
        return ApiResponse.error(message);
    }
}