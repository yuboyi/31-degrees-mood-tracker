package com.degrees31.aiplatform.config;

import com.degrees31.aiplatform.entity.User;
import com.degrees31.aiplatform.service.UserService;
import com.degrees31.aiplatform.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT认证拦截器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // OPTIONS请求直接通过
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader(jwtUtil.getHeader());
        String token = jwtUtil.extractTokenFromHeader(authHeader);

        if (token == null) {
            log.warn("请求缺少认证令牌，URI: {}", request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"缺少认证令牌\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"}");
            return false;
        }

        try {
            if (!jwtUtil.validateToken(token)) {
                log.warn("无效的认证令牌，URI: {}", request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":401,\"message\":\"令牌无效或已过期\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"}");
                return false;
            }

            // 验证用户是否存在且活跃
            Long userId = jwtUtil.getUserIdFromToken(token);
            User user = userService.getUserById(userId);

            if (user == null || !user.isActive()) {
                log.warn("用户不存在或已禁用，userId: {}", userId);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":401,\"message\":\"用户不存在或已禁用\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"}");
                return false;
            }

            // 将用户信息添加到请求属性中
            request.setAttribute("currentUserId", userId);
            request.setAttribute("currentUser", user);

            return true;

        } catch (Exception e) {
            log.error("JWT认证失败", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"认证失败\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"}");
            return false;
        }
    }
}