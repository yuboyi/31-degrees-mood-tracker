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
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * 百度AI服务工具类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Component
public class BaiduAiUtil {

    @Value("${ai.baidu.api-key}")
    private String apiKey;

    @Value("${ai.baidu.secret-key}")
    private String secretKey;

    @Value("${ai.baidu.text-to-image-url}")
    private String textToImageUrl;

    @Value("${ai.baidu.image-to-image-url}")
    private String imageToImageUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    // 缓存访问令牌
    private String accessToken;
    private long tokenExpireTime;

    /**
     * 获取访问令牌
     */
    public String getAccessToken() {
        // 检查缓存的令牌是否还有效
        if (accessToken != null && System.currentTimeMillis() < tokenExpireTime) {
            return accessToken;
        }

        try {
            String tokenUrl = String.format(
                "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=%s&client_secret=%s",
                apiKey, secretKey);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(tokenUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode jsonNode = objectMapper.readTree(response.body());
                
                if (jsonNode.has("access_token")) {
                    accessToken = jsonNode.get("access_token").asText();
                    int expiresIn = jsonNode.get("expires_in").asInt();
                    // 提前5分钟过期，确保令牌有效性
                    tokenExpireTime = System.currentTimeMillis() + (expiresIn - 300) * 1000L;
                    
                    log.info("百度AI访问令牌获取成功，有效期: {}秒", expiresIn);
                    return accessToken;
                } else {
                    log.error("获取百度AI访问令牌失败: {}", response.body());
                    return null;
                }
            } else {
                log.error("获取百度AI访问令牌失败，状态码: {}, 响应: {}", response.statusCode(), response.body());
                return null;
            }
        } catch (Exception e) {
            log.error("获取百度AI访问令牌异常", e);
            return null;
        }
    }

    /**
     * 文生图
     */
    public AiGenerationResult textToImage(String prompt, String negativePrompt, String style, Integer width, Integer height) {
        String token = getAccessToken();
        if (token == null) {
            return AiGenerationResult.error("获取访问令牌失败");
        }

        try {
            // 构建请求参数
            Map<String, Object> params = new HashMap<>();
            params.put("prompt", prompt);
            
            if (negativePrompt != null && !negativePrompt.trim().isEmpty()) {
                params.put("negative_prompt", negativePrompt);
            }
            
            if (style != null) {
                params.put("style", convertStyleToBaidu(style));
            }
            
            if (width != null && height != null) {
                params.put("width", width);
                params.put("height", height);
            }
            
            // 设置其他默认参数
            params.put("n", 1); // 生成1张图片
            params.put("steps", 20); // 推理步数
            params.put("sampler_index", "Euler a"); // 采样方法

            String requestBody = objectMapper.writeValueAsString(params);
            String url = textToImageUrl + "?access_token=" + token;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return parseAiResponse(response.body(), response.statusCode());

        } catch (Exception e) {
            log.error("百度AI文生图请求异常", e);
            return AiGenerationResult.error("文生图请求异常: " + e.getMessage());
        }
    }

    /**
     * 图生图
     */
    public AiGenerationResult imageToImage(String prompt, String imageBase64, String style, Float strength) {
        String token = getAccessToken();
        if (token == null) {
            return AiGenerationResult.error("获取访问令牌失败");
        }

        try {
            Map<String, Object> params = new HashMap<>();
            params.put("prompt", prompt);
            params.put("image", imageBase64);
            
            if (style != null) {
                params.put("style", convertStyleToBaidu(style));
            }
            
            if (strength != null) {
                params.put("strength", strength);
            } else {
                params.put("strength", 0.7f); // 默认强度
            }

            String requestBody = objectMapper.writeValueAsString(params);
            String url = imageToImageUrl + "?access_token=" + token;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return parseAiResponse(response.body(), response.statusCode());

        } catch (Exception e) {
            log.error("百度AI图生图请求异常", e);
            return AiGenerationResult.error("图生图请求异常: " + e.getMessage());
        }
    }

    /**
     * 解析AI响应
     */
    private AiGenerationResult parseAiResponse(String responseBody, int statusCode) {
        try {
            JsonNode jsonNode = objectMapper.readTree(responseBody);

            if (statusCode != 200) {
                String errorMsg = "未知错误";
                if (jsonNode.has("error_msg")) {
                    errorMsg = jsonNode.get("error_msg").asText();
                } else if (jsonNode.has("message")) {
                    errorMsg = jsonNode.get("message").asText();
                }
                
                log.error("百度AI API返回错误，状态码: {}, 错误: {}", statusCode, errorMsg);
                return AiGenerationResult.error("AI服务错误: " + errorMsg);
            }

            // 检查是否有错误码
            if (jsonNode.has("error_code")) {
                int errorCode = jsonNode.get("error_code").asInt();
                String errorMsg = jsonNode.get("error_msg").asText();
                
                log.error("百度AI API返回业务错误，错误码: {}, 错误信息: {}", errorCode, errorMsg);
                return AiGenerationResult.error("AI服务错误: " + errorMsg);
            }

            // 解析成功响应
            if (jsonNode.has("data")) {
                JsonNode dataNode = jsonNode.get("data");
                
                if (dataNode.isArray() && dataNode.size() > 0) {
                    JsonNode firstResult = dataNode.get(0);
                    
                    if (firstResult.has("b64_image")) {
                        String imageBase64 = firstResult.get("b64_image").asText();
                        
                        AiGenerationResult result = AiGenerationResult.success();
                        result.setImageBase64(imageBase64);
                        
                        // 提取其他信息
                        if (firstResult.has("seed")) {
                            result.setSeed(firstResult.get("seed").asLong());
                        }
                        
                        return result;
                    }
                }
            }

            log.error("百度AI API响应格式错误: {}", responseBody);
            return AiGenerationResult.error("AI服务响应格式错误");

        } catch (IOException e) {
            log.error("解析百度AI响应失败", e);
            return AiGenerationResult.error("解析AI响应失败: " + e.getMessage());
        }
    }

    /**
     * 转换风格到百度AI支持的格式
     */
    private String convertStyleToBaidu(String style) {
        if (style == null) {
            return null;
        }
        
        switch (style) {
            case "写实":
            case "真实":
                return "realistic";
            case "动漫":
            case "卡通":
                return "anime";
            case "国风":
            case "中国风":
                return "chinese_style";
            case "油画":
                return "oil_painting";
            case "水彩":
                return "watercolor";
            case "素描":
                return "sketch";
            default:
                return style.toLowerCase();
        }
    }

    /**
     * 图片Base64编码
     */
    public String encodeImageToBase64(byte[] imageBytes) {
        return Base64.getEncoder().encodeToString(imageBytes);
    }

    /**
     * Base64解码为图片字节
     */
    public byte[] decodeBase64ToImage(String base64) {
        return Base64.getDecoder().decode(base64);
    }

    /**
     * 验证配置是否完整
     */
    public boolean isConfigValid() {
        return apiKey != null && !apiKey.isEmpty() && 
               secretKey != null && !secretKey.isEmpty() &&
               textToImageUrl != null && !textToImageUrl.isEmpty();
    }

    /**
     * AI生成结果
     */
    @Data
    public static class AiGenerationResult {
        private boolean success;
        private String message;
        private String imageBase64;
        private String imageUrl;
        private Long seed;
        private Integer width;
        private Integer height;

        public static AiGenerationResult success() {
            AiGenerationResult result = new AiGenerationResult();
            result.setSuccess(true);
            result.setMessage("生成成功");
            return result;
        }

        public static AiGenerationResult error(String message) {
            AiGenerationResult result = new AiGenerationResult();
            result.setSuccess(false);
            result.setMessage(message);
            return result;
        }
    }
}