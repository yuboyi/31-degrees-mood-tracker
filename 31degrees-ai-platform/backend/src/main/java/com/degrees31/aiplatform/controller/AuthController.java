package com.degrees31.aiplatform.controller;

import com.degrees31.aiplatform.dto.ApiResponse;
import com.degrees31.aiplatform.dto.LoginResponse;
import com.degrees31.aiplatform.dto.WechatLoginRequest;
import com.degrees31.aiplatform.entity.User;
import com.degrees31.aiplatform.service.UserService;
import com.degrees31.aiplatform.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 用户认证控制器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * 微信小程序登录
     */
    @PostMapping("/wechat/login")
    public ApiResponse<LoginResponse> wechatLogin(@Valid @RequestBody WechatLoginRequest request) {
        try {
            log.info("收到微信登录请求");
            
            LoginResponse response = userService.wechatLogin(request);
            
            String message = response.getIsNewUser() ? "欢迎新用户！" : "欢迎回来！";
            return ApiResponse.success(message, response);
            
        } catch (Exception e) {
            log.error("微信登录失败", e);
            return ApiResponse.error("登录失败: " + e.getMessage());
        }
    }

    /**
     * 刷新令牌
     */
    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refreshToken(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader(jwtUtil.getHeader());
            String token = jwtUtil.extractTokenFromHeader(authHeader);
            
            if (token == null) {
                return ApiResponse.unauthorized("缺少认证令牌");
            }
            
            if (!jwtUtil.validateToken(token)) {
                return ApiResponse.unauthorized("令牌无效或已过期");
            }
            
            // 获取用户信息
            Long userId = jwtUtil.getUserIdFromToken(token);
            User user = userService.getUserById(userId);
            
            if (user == null || !user.isActive()) {
                return ApiResponse.unauthorized("用户不存在或已禁用");
            }
            
            // 生成新令牌
            String newToken = jwtUtil.generateToken(user.getId(), user.getOpenid());
            
            // 构建响应
            LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                    .userId(user.getId())
                    .nickname(user.getDisplayName())
                    .avatarUrl(user.getAvatarUrl())
                    .vipLevel(user.getVipLevel())
                    .vipExpireTime(user.getVipExpireTime())
                    .dailyRequestsLeft(userService.getUserRemainingRequests(user.getId()))
                    .totalRequests(user.getTotalRequests())
                    .build();
            
            LoginResponse response = LoginResponse.success(newToken, jwtUtil.getExpiration(), userInfo, false);
            
            log.info("令牌刷新成功，userId: {}", userId);
            return ApiResponse.success("令牌刷新成功", response);
            
        } catch (Exception e) {
            log.error("刷新令牌失败", e);
            return ApiResponse.error("刷新令牌失败: " + e.getMessage());
        }
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public ApiResponse<LoginResponse.UserInfo> getCurrentUser(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader(jwtUtil.getHeader());
            String token = jwtUtil.extractTokenFromHeader(authHeader);
            
            if (token == null || !jwtUtil.validateToken(token)) {
                return ApiResponse.unauthorized("请先登录");
            }
            
            Long userId = jwtUtil.getUserIdFromToken(token);
            User user = userService.getUserById(userId);
            
            if (user == null || !user.isActive()) {
                return ApiResponse.unauthorized("用户不存在或已禁用");
            }
            
            LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                    .userId(user.getId())
                    .nickname(user.getDisplayName())
                    .avatarUrl(user.getAvatarUrl())
                    .vipLevel(user.getVipLevel())
                    .vipExpireTime(user.getVipExpireTime())
                    .dailyRequestsLeft(userService.getUserRemainingRequests(user.getId()))
                    .totalRequests(user.getTotalRequests())
                    .build();
            
            return ApiResponse.success(userInfo);
            
        } catch (Exception e) {
            log.error("获取用户信息失败", e);
            return ApiResponse.error("获取用户信息失败: " + e.getMessage());
        }
    }

    /**
     * 验证令牌是否有效
     */
    @PostMapping("/validate")
    public ApiResponse<Boolean> validateToken(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader(jwtUtil.getHeader());
            String token = jwtUtil.extractTokenFromHeader(authHeader);
            
            if (token == null) {
                return ApiResponse.success("令牌验证结果", false);
            }
            
            boolean isValid = jwtUtil.validateToken(token);
            
            if (isValid) {
                // 进一步验证用户是否存在且活跃
                Long userId = jwtUtil.getUserIdFromToken(token);
                User user = userService.getUserById(userId);
                isValid = user != null && user.isActive();
            }
            
            return ApiResponse.success("令牌验证结果", isValid);
            
        } catch (Exception e) {
            log.error("令牌验证失败", e);
            return ApiResponse.success("令牌验证结果", false);
        }
    }

    /**
     * 用户登出（可选实现，主要用于清理客户端令牌）
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        try {
            // 在实际实现中，可以将令牌加入黑名单
            // 这里只是返回成功，客户端应该清除本地存储的令牌
            
            String authHeader = request.getHeader(jwtUtil.getHeader());
            String token = jwtUtil.extractTokenFromHeader(authHeader);
            
            if (token != null && jwtUtil.validateToken(token)) {
                Long userId = jwtUtil.getUserIdFromToken(token);
                log.info("用户登出，userId: {}", userId);
            }
            
            return ApiResponse.success("登出成功", null);
            
        } catch (Exception e) {
            log.error("用户登出失败", e);
            return ApiResponse.error("登出失败: " + e.getMessage());
        }
    }
}