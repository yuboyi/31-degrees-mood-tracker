package com.degrees31.aiplatform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 微信小程序登录请求DTO
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
public class WechatLoginRequest {

    /**
     * 微信小程序登录凭证code
     */
    @NotBlank(message = "登录凭证不能为空")
    private String code;

    /**
     * 加密数据（可选）
     */
    private String encryptedData;

    /**
     * 加密算法的初始向量（可选）
     */
    private String iv;

    /**
     * 用户信息（可选，用于更新用户资料）
     */
    private WechatUserInfo userInfo;

    @Data
    public static class WechatUserInfo {
        
        /**
         * 用户昵称
         */
        private String nickName;

        /**
         * 用户头像URL
         */
        private String avatarUrl;

        /**
         * 性别：0未知，1男，2女
         */
        private Integer gender;

        /**
         * 城市
         */
        private String city;

        /**
         * 省份
         */
        private String province;

        /**
         * 国家
         */
        private String country;

        /**
         * 语言
         */
        private String language;
    }
}