package com.degrees31.aiplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 登录响应DTO
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    /**
     * JWT访问令牌
     */
    private String accessToken;

    /**
     * 令牌类型
     */
    private String tokenType = "Bearer";

    /**
     * 令牌过期时间戳
     */
    private Long expiresIn;

    /**
     * 用户信息
     */
    private UserInfo userInfo;

    /**
     * 是否新用户
     */
    private Boolean isNewUser;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        
        /**
         * 用户ID
         */
        private Long userId;

        /**
         * 用户昵称
         */
        private String nickname;

        /**
         * 头像URL
         */
        private String avatarUrl;

        /**
         * VIP等级
         */
        private Integer vipLevel;

        /**
         * VIP过期时间
         */
        private LocalDateTime vipExpireTime;

        /**
         * 今日剩余请求次数
         */
        private Integer dailyRequestsLeft;

        /**
         * 总请求次数
         */
        private Integer totalRequests;
    }

    /**
     * 创建成功响应
     */
    public static LoginResponse success(String token, Long expiresIn, UserInfo userInfo, Boolean isNewUser) {
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .userInfo(userInfo)
                .isNewUser(isNewUser)
                .build();
    }
}