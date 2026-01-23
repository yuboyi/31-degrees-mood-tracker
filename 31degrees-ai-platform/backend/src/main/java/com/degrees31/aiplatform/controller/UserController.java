package com.degrees31.aiplatform.controller;

import com.degrees31.aiplatform.dto.ApiResponse;
import com.degrees31.aiplatform.dto.LoginResponse;
import com.degrees31.aiplatform.entity.User;
import com.degrees31.aiplatform.service.UserService;
import com.degrees31.aiplatform.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 用户管理控制器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * 获取用户详细信息
     */
    @GetMapping("/profile")
    public ApiResponse<User> getUserProfile(HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            User user = userService.getUserById(userId);
            if (user == null) {
                return ApiResponse.notFound("用户不存在");
            }

            // 清除敏感信息
            user.setOpenid(null);
            user.setUnionid(null);

            return ApiResponse.success(user);

        } catch (Exception e) {
            log.error("获取用户资料失败", e);
            return ApiResponse.error("获取用户资料失败: " + e.getMessage());
        }
    }

    /**
     * 更新用户昵称
     */
    @PutMapping("/nickname")
    public ApiResponse<Void> updateNickname(
            @RequestParam String nickname,
            HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            if (nickname == null || nickname.trim().isEmpty()) {
                return ApiResponse.badRequest("昵称不能为空");
            }

            if (nickname.length() > 50) {
                return ApiResponse.badRequest("昵称长度不能超过50个字符");
            }

            User user = userService.getUserById(userId);
            if (user == null) {
                return ApiResponse.notFound("用户不存在");
            }

            user.setNickname(nickname.trim());
            userService.updateUserInfo(user, null);

            return ApiResponse.success("昵称更新成功", null);

        } catch (Exception e) {
            log.error("更新昵称失败", e);
            return ApiResponse.error("更新昵称失败: " + e.getMessage());
        }
    }

    /**
     * 更新用户头像
     */
    @PutMapping("/avatar")
    public ApiResponse<Void> updateAvatar(
            @RequestParam String avatarUrl,
            HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
                return ApiResponse.badRequest("头像URL不能为空");
            }

            User user = userService.getUserById(userId);
            if (user == null) {
                return ApiResponse.notFound("用户不存在");
            }

            user.setAvatarUrl(avatarUrl.trim());
            userService.updateUserInfo(user, null);

            return ApiResponse.success("头像更新成功", null);

        } catch (Exception e) {
            log.error("更新头像失败", e);
            return ApiResponse.error("更新头像失败: " + e.getMessage());
        }
    }

    /**
     * 获取用户统计信息
     */
    @GetMapping("/stats")
    public ApiResponse<UserStats> getUserStats(HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            User user = userService.getUserById(userId);
            if (user == null) {
                return ApiResponse.notFound("用户不存在");
            }

            UserStats stats = UserStats.builder()
                    .totalRequests(user.getTotalRequests())
                    .dailyRequests(user.getDailyRequests())
                    .remainingRequests(userService.getUserRemainingRequests(userId))
                    .vipLevel(user.getVipLevel())
                    .vipExpireTime(user.getVipExpireTime())
                    .isVip(user.isVip())
                    .build();

            return ApiResponse.success(stats);

        } catch (Exception e) {
            log.error("获取用户统计失败", e);
            return ApiResponse.error("获取用户统计失败: " + e.getMessage());
        }
    }

    /**
     * 检查用户请求限制
     */
    @GetMapping("/check-limit")
    public ApiResponse<RequestLimitInfo> checkRequestLimit(HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            boolean canRequest = userService.checkDailyRequestLimit(userId);
            int remainingRequests = userService.getUserRemainingRequests(userId);

            RequestLimitInfo info = RequestLimitInfo.builder()
                    .canRequest(canRequest)
                    .remainingRequests(remainingRequests)
                    .message(canRequest ? "可以继续使用" : "今日使用次数已达上限")
                    .build();

            return ApiResponse.success(info);

        } catch (Exception e) {
            log.error("检查请求限制失败", e);
            return ApiResponse.error("检查请求限制失败: " + e.getMessage());
        }
    }

    /**
     * 从请求中获取当前用户ID
     */
    private Long getCurrentUserId(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader(jwtUtil.getHeader());
            String token = jwtUtil.extractTokenFromHeader(authHeader);
            
            if (token != null && jwtUtil.validateToken(token)) {
                return jwtUtil.getUserIdFromToken(token);
            }
            return null;
        } catch (Exception e) {
            log.warn("获取当前用户ID失败", e);
            return null;
        }
    }

    /**
     * 用户统计信息DTO
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UserStats {
        private Integer totalRequests;
        private Integer dailyRequests;
        private Integer remainingRequests;
        private Integer vipLevel;
        private java.time.LocalDateTime vipExpireTime;
        private Boolean isVip;
    }

    /**
     * 请求限制信息DTO
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RequestLimitInfo {
        private Boolean canRequest;
        private Integer remainingRequests;
        private String message;
    }
}