package com.degrees31.aiplatform.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * Web配置类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final JwtAuthInterceptor jwtAuthInterceptor;

    @Value("${cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${cors.allowed-methods}")
    private List<String> allowedMethods;

    @Value("${cors.allowed-headers}")
    private String allowedHeaders;

    @Value("${cors.allow-credentials}")
    private boolean allowCredentials;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtAuthInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        // 排除不需要认证的路径
                        "/api/health/**",           // 健康检查
                        "/api/auth/wechat/login",   // 微信登录
                        "/api/auth/validate",       // 令牌验证
                        "/api/public/**",           // 公共接口
                        "/api/docs/**",             // API文档
                        "/api/actuator/**"          // 监控端点
                );
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins.toArray(new String[0]))
                .allowedMethods(allowedMethods.toArray(new String[0]))
                .allowedHeaders(allowedHeaders)
                .allowCredentials(allowCredentials)
                .maxAge(3600); // 预检请求的有效期，单位：秒
    }
}