package com.degrees31.aiplatform.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * 微信API工具类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Component
public class WechatApiUtil {

    @Value("${wechat.miniprogram.app-id}")
    private String appId;

    @Value("${wechat.miniprogram.app-secret}")
    private String appSecret;

    @Value("${wechat.miniprogram.login-url}")
    private String loginUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * 微信小程序登录，获取session信息
     * 
     * @param code 小程序登录凭证
     * @return 微信会话信息
     */
    public WechatSessionInfo getSessionInfo(String code) {
        try {
            String url = String.format("%s?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                    loginUrl, appId, appSecret, code);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return parseSessionInfo(response.body());
            } else {
                log.error("微信API调用失败，状态码: {}, 响应: {}", response.statusCode(), response.body());
                return null;
            }
        } catch (Exception e) {
            log.error("调用微信登录API异常", e);
            return null;
        }
    }

    /**
     * 解析微信API响应
     * 
     * @param responseBody 响应体
     * @return 会话信息
     */
    private WechatSessionInfo parseSessionInfo(String responseBody) {
        try {
            JsonNode jsonNode = objectMapper.readTree(responseBody);
            
            WechatSessionInfo sessionInfo = new WechatSessionInfo();
            
            // 检查是否有错误
            if (jsonNode.has("errcode")) {
                int errcode = jsonNode.get("errcode").asInt();
                String errmsg = jsonNode.get("errmsg").asText();
                
                if (errcode != 0) {
                    log.error("微信API返回错误: errcode={}, errmsg={}", errcode, errmsg);
                    sessionInfo.setSuccess(false);
                    sessionInfo.setErrorCode(errcode);
                    sessionInfo.setErrorMessage(errmsg);
                    return sessionInfo;
                }
            }
            
            // 解析成功响应
            if (jsonNode.has("openid")) {
                sessionInfo.setSuccess(true);
                sessionInfo.setOpenid(jsonNode.get("openid").asText());
                
                if (jsonNode.has("session_key")) {
                    sessionInfo.setSessionKey(jsonNode.get("session_key").asText());
                }
                
                if (jsonNode.has("unionid")) {
                    sessionInfo.setUnionid(jsonNode.get("unionid").asText());
                }
            } else {
                log.error("微信API响应中缺少openid字段: {}", responseBody);
                sessionInfo.setSuccess(false);
                sessionInfo.setErrorMessage("响应中缺少openid字段");
            }
            
            return sessionInfo;
        } catch (IOException e) {
            log.error("解析微信API响应失败", e);
            WechatSessionInfo sessionInfo = new WechatSessionInfo();
            sessionInfo.setSuccess(false);
            sessionInfo.setErrorMessage("解析响应失败: " + e.getMessage());
            return sessionInfo;
        }
    }

    /**
     * 微信会话信息
     */
    @Data
    public static class WechatSessionInfo {
        
        /**
         * 是否成功
         */
        private boolean success;
        
        /**
         * 微信openid
         */
        private String openid;
        
        /**
         * 会话密钥
         */
        private String sessionKey;
        
        /**
         * 微信unionid（可选）
         */
        private String unionid;
        
        /**
         * 错误码
         */
        private Integer errorCode;
        
        /**
         * 错误信息
         */
        private String errorMessage;

        /**
         * 获取错误描述
         */
        public String getErrorDescription() {
            if (errorCode == null) {
                return errorMessage;
            }
            
            switch (errorCode) {
                case -1:
                    return "系统繁忙，此时请开发者稍候再试";
                case 40029:
                    return "code 无效";
                case 45011:
                    return "频率限制，每个用户每分钟100次";
                case 40013:
                    return "不合法的 appid";
                case 40125:
                    return "invalid appsecret";
                default:
                    return errorMessage != null ? errorMessage : "未知错误";
            }
        }
    }

    /**
     * 验证配置是否完整
     */
    public boolean isConfigValid() {
        return appId != null && !appId.isEmpty() && 
               appSecret != null && !appSecret.isEmpty() &&
               loginUrl != null && !loginUrl.isEmpty();
    }

    /**
     * 获取应用ID
     */
    public String getAppId() {
        return appId;
    }
}