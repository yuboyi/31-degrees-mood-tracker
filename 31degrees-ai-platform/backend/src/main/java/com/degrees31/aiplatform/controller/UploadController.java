package com.degrees31.aiplatform.controller;

import com.degrees31.aiplatform.dto.ApiResponse;
import com.degrees31.aiplatform.util.JwtUtil;
import com.degrees31.aiplatform.util.OssUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 文件上传控制器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class UploadController {

    private final OssUtil ossUtil;
    private final JwtUtil jwtUtil;

    /**
     * 上传图片文件
     */
    @PostMapping("/image")
    public ApiResponse<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "images") String folder,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            // 验证文件
            if (file == null || file.isEmpty()) {
                return ApiResponse.badRequest("请选择要上传的文件");
            }

            // 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ApiResponse.badRequest("只能上传图片文件");
            }

            // 验证文件大小
            if (file.getSize() > 10 * 1024 * 1024) {
                return ApiResponse.badRequest("文件大小不能超过10MB");
            }

            // 构建文件夹路径（包含用户ID）
            String folderPath = String.format("%s/user_%d", folder, userId);

            // 上传文件
            OssUtil.UploadResult uploadResult = ossUtil.uploadFile(file, folderPath);

            if (uploadResult.isSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("objectKey", uploadResult.getObjectKey());
                result.put("fileUrl", uploadResult.getFileUrl());
                result.put("fileSize", uploadResult.getFileSize());
                result.put("fileName", file.getOriginalFilename());

                log.info("用户文件上传成功，userId: {}, fileName: {}, url: {}", 
                        userId, file.getOriginalFilename(), uploadResult.getFileUrl());

                return ApiResponse.success("文件上传成功", result);
            } else {
                log.warn("用户文件上传失败，userId: {}, error: {}", userId, uploadResult.getMessage());
                return ApiResponse.error("文件上传失败: " + uploadResult.getMessage());
            }

        } catch (Exception e) {
            log.error("文件上传异常", e);
            return ApiResponse.error("文件上传异常: " + e.getMessage());
        }
    }

    /**
     * 上传Base64图片
     */
    @PostMapping("/image/base64")
    public ApiResponse<Map<String, Object>> uploadBase64Image(
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            String base64 = requestBody.get("base64");
            String folder = requestBody.getOrDefault("folder", "images");

            if (base64 == null || base64.trim().isEmpty()) {
                return ApiResponse.badRequest("Base64数据不能为空");
            }

            // 移除Base64前缀（如果有）
            if (base64.contains(",")) {
                base64 = base64.substring(base64.indexOf(",") + 1);
            }

            // 构建文件夹路径
            String folderPath = String.format("%s/user_%d", folder, userId);

            // 上传Base64图片
            OssUtil.UploadResult uploadResult = ossUtil.uploadBase64Image(base64, folderPath);

            if (uploadResult.isSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("objectKey", uploadResult.getObjectKey());
                result.put("fileUrl", uploadResult.getFileUrl());
                result.put("fileSize", uploadResult.getFileSize());

                log.info("用户Base64图片上传成功，userId: {}, url: {}", userId, uploadResult.getFileUrl());

                return ApiResponse.success("图片上传成功", result);
            } else {
                log.warn("用户Base64图片上传失败，userId: {}, error: {}", userId, uploadResult.getMessage());
                return ApiResponse.error("图片上传失败: " + uploadResult.getMessage());
            }

        } catch (Exception e) {
            log.error("Base64图片上传异常", e);
            return ApiResponse.error("图片上传异常: " + e.getMessage());
        }
    }

    /**
     * 删除文件
     */
    @DeleteMapping("/delete")
    public ApiResponse<Void> deleteFile(
            @RequestParam("objectKey") String objectKey,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            if (objectKey == null || objectKey.trim().isEmpty()) {
                return ApiResponse.badRequest("文件标识不能为空");
            }

            // 验证文件是否属于当前用户
            if (!objectKey.contains("user_" + userId)) {
                return ApiResponse.forbidden("无权限删除此文件");
            }

            // 删除文件
            boolean deleted = ossUtil.deleteFile(objectKey);

            if (deleted) {
                log.info("用户文件删除成功，userId: {}, objectKey: {}", userId, objectKey);
                return ApiResponse.success("文件删除成功", null);
            } else {
                log.warn("用户文件删除失败，userId: {}, objectKey: {}", userId, objectKey);
                return ApiResponse.error("文件删除失败");
            }

        } catch (Exception e) {
            log.error("文件删除异常", e);
            return ApiResponse.error("文件删除异常: " + e.getMessage());
        }
    }

    /**
     * 检查文件是否存在
     */
    @GetMapping("/exists")
    public ApiResponse<Map<String, Boolean>> checkFileExists(
            @RequestParam("objectKey") String objectKey,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            if (objectKey == null || objectKey.trim().isEmpty()) {
                return ApiResponse.badRequest("文件标识不能为空");
            }

            // 检查文件是否存在
            boolean exists = ossUtil.doesObjectExist(objectKey);

            Map<String, Boolean> result = new HashMap<>();
            result.put("exists", exists);

            return ApiResponse.success(result);

        } catch (Exception e) {
            log.error("检查文件是否存在异常", e);
            return ApiResponse.error("检查文件异常: " + e.getMessage());
        }
    }

    /**
     * 生成预签名URL
     */
    @GetMapping("/presigned-url")
    public ApiResponse<Map<String, String>> generatePresignedUrl(
            @RequestParam("objectKey") String objectKey,
            @RequestParam(value = "expireMinutes", defaultValue = "60") int expireMinutes,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            if (objectKey == null || objectKey.trim().isEmpty()) {
                return ApiResponse.badRequest("文件标识不能为空");
            }

            // 验证文件是否属于当前用户（可选）
            if (!objectKey.contains("user_" + userId) && !objectKey.startsWith("public/")) {
                return ApiResponse.forbidden("无权限访问此文件");
            }

            // 生成预签名URL
            String presignedUrl = ossUtil.generatePresignedUrl(objectKey, expireMinutes);

            if (presignedUrl != null) {
                Map<String, String> result = new HashMap<>();
                result.put("presignedUrl", presignedUrl);
                result.put("expireMinutes", String.valueOf(expireMinutes));

                return ApiResponse.success(result);
            } else {
                return ApiResponse.error("生成预签名URL失败");
            }

        } catch (Exception e) {
            log.error("生成预签名URL异常", e);
            return ApiResponse.error("生成预签名URL异常: " + e.getMessage());
        }
    }

    /**
     * 获取上传配置信息
     */
    @GetMapping("/config")
    public ApiResponse<Map<String, Object>> getUploadConfig(HttpServletRequest request) {
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            Map<String, Object> config = new HashMap<>();
            config.put("maxFileSize", "10MB");
            config.put("allowedTypes", new String[]{"jpg", "jpeg", "png", "gif", "bmp", "webp"});
            config.put("userFolder", "images/user_" + userId);

            return ApiResponse.success(config);

        } catch (Exception e) {
            log.error("获取上传配置异常", e);
            return ApiResponse.error("获取上传配置异常: " + e.getMessage());
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
}