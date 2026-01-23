package com.degrees31.aiplatform.controller;

import com.degrees31.aiplatform.dto.AiDrawingRequest;
import com.degrees31.aiplatform.dto.AiDrawingResponse;
import com.degrees31.aiplatform.dto.ApiResponse;
import com.degrees31.aiplatform.entity.AiTask;
import com.degrees31.aiplatform.service.AiTaskService;
import com.degrees31.aiplatform.service.UserService;
import com.degrees31.aiplatform.util.JwtUtil;
import com.degrees31.aiplatform.util.ImageProcessUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AI绘画控制器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiDrawingController {

    private final AiTaskService aiTaskService;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final ImageProcessUtil imageProcessUtil;

    /**
     * 文生图接口
     */
    @PostMapping("/text-to-image")
    public ApiResponse<AiDrawingResponse> textToImage(
            @Valid @RequestBody AiDrawingRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(httpRequest);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            // 验证请求参数
            if (!request.isValidTextToImageRequest()) {
                return ApiResponse.badRequest("文本描述不能为空");
            }

            // 检查用户每日请求限制
            if (!userService.checkDailyRequestLimit(userId)) {
                return ApiResponse.forbidden("今日使用次数已达上限，请明日再试或升级VIP");
            }

            // 创建AI任务
            AiTask task = aiTaskService.createTextToImageTask(
                    userId,
                    request.getCleanPrompt(),
                    request.getCleanNegativePrompt(),
                    request.getStyle(),
                    request.getWidth(),
                    request.getHeight()
            );

            if (task == null) {
                return ApiResponse.error("创建AI任务失败");
            }

            // 更新用户请求次数
            userService.incrementUserRequests(userId);

            // 异步执行AI任务
            aiTaskService.executeTaskAsync(task.getId());

            // 返回响应
            AiDrawingResponse response = AiDrawingResponse.fromTask(task);
            
            log.info("文生图任务创建成功，userId: {}, taskId: {}, prompt: {}", 
                    userId, task.getId(), request.getCleanPrompt());

            return ApiResponse.success("文生图任务已创建，正在处理中...", response);

        } catch (Exception e) {
            log.error("文生图请求异常", e);
            return ApiResponse.error("文生图请求失败: " + e.getMessage());
        }
    }

    /**
     * 图生图接口
     */
    @PostMapping("/image-to-image")
    public ApiResponse<AiDrawingResponse> imageToImage(
            @Valid @RequestBody AiDrawingRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(httpRequest);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            // 验证请求参数
            if (!request.isValidImageToImageRequest()) {
                return ApiResponse.badRequest("文本描述和原图不能为空");
            }

            // 检查用户每日请求限制
            if (!userService.checkDailyRequestLimit(userId)) {
                return ApiResponse.forbidden("今日使用次数已达上限，请明日再试或升级VIP");
            }

            // 确定原图URL
            String sourceImageUrl = request.getSourceImageUrl();
            
            // 如果提供的是Base64，需要先上传
            if (sourceImageUrl == null && request.getSourceImageBase64() != null) {
                // TODO: 上传Base64图片并获取URL
                // 这里应该调用上传服务
                return ApiResponse.error("暂不支持Base64格式，请先上传图片");
            }

            if (sourceImageUrl == null) {
                return ApiResponse.badRequest("原图URL不能为空");
            }

            // 创建AI任务
            AiTask task = aiTaskService.createImageToImageTask(
                    userId,
                    request.getCleanPrompt(),
                    sourceImageUrl,
                    request.getStyle()
            );

            if (task == null) {
                return ApiResponse.error("创建AI任务失败");
            }

            // 更新用户请求次数
            userService.incrementUserRequests(userId);

            // 异步执行AI任务
            aiTaskService.executeTaskAsync(task.getId());

            // 返回响应
            AiDrawingResponse response = AiDrawingResponse.fromTask(task);
            
            log.info("图生图任务创建成功，userId: {}, taskId: {}, prompt: {}", 
                    userId, task.getId(), request.getCleanPrompt());

            return ApiResponse.success("图生图任务已创建，正在处理中...", response);

        } catch (Exception e) {
            log.error("图生图请求异常", e);
            return ApiResponse.error("图生图请求失败: " + e.getMessage());
        }
    }

    /**
     * 获取任务状态
     */
    @GetMapping("/task/{taskId}")
    public ApiResponse<AiDrawingResponse> getTaskStatus(
            @PathVariable Long taskId,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            // 获取任务信息
            AiTask task = aiTaskService.getTaskById(taskId);
            if (task == null) {
                return ApiResponse.notFound("任务不存在");
            }

            // 验证任务所有权
            if (!task.getUserId().equals(userId)) {
                return ApiResponse.forbidden("无权限查看此任务");
            }

            // 返回任务状态
            AiDrawingResponse response = AiDrawingResponse.fromTask(task);
            return ApiResponse.success(response);

        } catch (Exception e) {
            log.error("获取任务状态异常", e);
            return ApiResponse.error("获取任务状态失败: " + e.getMessage());
        }
    }

    /**
     * 获取用户的AI任务列表
     */
    @GetMapping("/tasks")
    public ApiResponse<List<AiDrawingResponse>> getUserTasks(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "taskType", required = false) String taskType,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            // 获取任务列表
            List<AiTask> tasks;
            if (status != null && !status.trim().isEmpty()) {
                tasks = aiTaskService.getUserTasksByStatus(userId, status);
            } else if (taskType != null && !taskType.trim().isEmpty()) {
                tasks = aiTaskService.getUserTasksByType(userId, taskType);
            } else {
                tasks = aiTaskService.getUserTasks(userId);
            }

            // 分页处理（简单实现）
            int fromIndex = (page - 1) * size;
            int toIndex = Math.min(fromIndex + size, tasks.size());
            
            if (fromIndex >= tasks.size()) {
                tasks = List.of(); // 空列表
            } else {
                tasks = tasks.subList(fromIndex, toIndex);
            }

            // 转换为响应DTO
            List<AiDrawingResponse> responses = tasks.stream()
                    .map(AiDrawingResponse::fromTask)
                    .collect(Collectors.toList());

            return ApiResponse.success(responses);

        } catch (Exception e) {
            log.error("获取用户AI任务列表异常", e);
            return ApiResponse.error("获取任务列表失败: " + e.getMessage());
        }
    }

    /**
     * 重试失败的任务
     */
    @PostMapping("/task/{taskId}/retry")
    public ApiResponse<AiDrawingResponse> retryTask(
            @PathVariable Long taskId,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            // 检查用户每日请求限制
            if (!userService.checkDailyRequestLimit(userId)) {
                return ApiResponse.forbidden("今日使用次数已达上限，请明日再试或升级VIP");
            }

            // 重试任务
            boolean success = aiTaskService.retryTask(taskId, userId);
            if (!success) {
                return ApiResponse.error("重试任务失败，请检查任务状态");
            }

            // 更新用户请求次数
            userService.incrementUserRequests(userId);

            // 获取更新后的任务信息
            AiTask task = aiTaskService.getTaskById(taskId);
            AiDrawingResponse response = AiDrawingResponse.fromTask(task);

            log.info("任务重试成功，userId: {}, taskId: {}", userId, taskId);

            return ApiResponse.success("任务已重新开始处理", response);

        } catch (Exception e) {
            log.error("重试任务异常", e);
            return ApiResponse.error("重试任务失败: " + e.getMessage());
        }
    }

    /**
     * 删除任务
     */
    @DeleteMapping("/task/{taskId}")
    public ApiResponse<Void> deleteTask(
            @PathVariable Long taskId,
            HttpServletRequest request) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            // 删除任务
            boolean success = aiTaskService.deleteTask(taskId, userId);
            if (!success) {
                return ApiResponse.error("删除任务失败，请检查任务是否存在");
            }

            log.info("任务删除成功，userId: {}, taskId: {}", userId, taskId);

            return ApiResponse.success("任务删除成功", null);

        } catch (Exception e) {
            log.error("删除任务异常", e);
            return ApiResponse.error("删除任务失败: " + e.getMessage());
        }
    }

    /**
     * 获取用户AI统计信息
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getUserAiStats(HttpServletRequest request) {
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            // 获取统计信息
            AiTaskService.TaskStats stats = aiTaskService.getTaskStats(userId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalTasks", stats.getTotalTasks());
            result.put("completedTasks", stats.getCompletedTasks());
            result.put("failedTasks", stats.getFailedTasks());
            result.put("processingTasks", stats.getProcessingTasks());
            result.put("totalCostPoints", stats.getTotalCostPoints());
            result.put("remainingRequests", userService.getUserRemainingRequests(userId));

            return ApiResponse.success(result);

        } catch (Exception e) {
            log.error("获取用户AI统计信息异常", e);
            return ApiResponse.error("获取统计信息失败: " + e.getMessage());
        }
    }

    /**
     * 图转2.5D接口
     */
    @PostMapping("/image-to-25d")
    public ApiResponse<AiDrawingResponse> imageTo25D(
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest httpRequest) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(httpRequest);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            String sourceImageUrl = requestBody.get("sourceImageUrl");
            if (sourceImageUrl == null || sourceImageUrl.trim().isEmpty()) {
                return ApiResponse.badRequest("原图URL不能为空");
            }

            // 检查用户每日请求限制
            if (!userService.checkDailyRequestLimit(userId)) {
                return ApiResponse.forbidden("今日使用次数已达上限，请明日再试或升级VIP");
            }

            // 创建AI任务
            AiTask task = aiTaskService.createImageTo3DTask(userId, sourceImageUrl);
            if (task == null) {
                return ApiResponse.error("创建AI任务失败");
            }

            // 设置任务类型为2.5D
            task.setTaskType("image_to_25d");

            // 更新用户请求次数
            userService.incrementUserRequests(userId);

            // 异步执行AI任务
            aiTaskService.executeTaskAsync(task.getId());

            // 返回响应
            AiDrawingResponse response = AiDrawingResponse.fromTask(task);
            
            log.info("图转2.5D任务创建成功，userId: {}, taskId: {}", userId, task.getId());

            return ApiResponse.success("图转2.5D任务已创建，正在处理中...", response);

        } catch (Exception e) {
            log.error("图转2.5D请求异常", e);
            return ApiResponse.error("图转2.5D请求失败: " + e.getMessage());
        }
    }

    /**
     * 图转3D接口
     */
    @PostMapping("/image-to-3d")
    public ApiResponse<AiDrawingResponse> imageTo3D(
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest httpRequest) {
        
        try {
            // 获取当前用户ID
            Long userId = getCurrentUserId(httpRequest);
            if (userId == null) {
                return ApiResponse.unauthorized("请先登录");
            }

            String sourceImageUrl = requestBody.get("sourceImageUrl");
            if (sourceImageUrl == null || sourceImageUrl.trim().isEmpty()) {
                return ApiResponse.badRequest("原图URL不能为空");
            }

            // 检查用户每日请求限制
            if (!userService.checkDailyRequestLimit(userId)) {
                return ApiResponse.forbidden("今日使用次数已达上限，请明日再试或升级VIP");
            }

            // 创建AI任务
            AiTask task = aiTaskService.createImageTo3DTask(userId, sourceImageUrl);
            if (task == null) {
                return ApiResponse.error("创建AI任务失败");
            }

            // 更新用户请求次数
            userService.incrementUserRequests(userId);

            // 异步执行AI任务
            aiTaskService.executeTaskAsync(task.getId());

            // 返回响应
            AiDrawingResponse response = AiDrawingResponse.fromTask(task);
            
            log.info("图转3D任务创建成功，userId: {}, taskId: {}", userId, task.getId());

            return ApiResponse.success("图转3D任务已创建，正在处理中...", response);

        } catch (Exception e) {
            log.error("图转3D请求异常", e);
            return ApiResponse.error("图转3D请求失败: " + e.getMessage());
        }
    }

    /**
     * 获取支持的风格列表
     */
    @GetMapping("/styles")
    public ApiResponse<List<Map<String, String>>> getSupportedStyles() {
        try {
            List<Map<String, String>> styles = List.of(
                    Map.of("key", "写实", "name", "写实", "description", "真实照片风格"),
                    Map.of("key", "动漫", "name", "动漫", "description", "日式动漫风格"),
                    Map.of("key", "国风", "name", "国风", "description", "中国传统艺术风格"),
                    Map.of("key", "油画", "name", "油画", "description", "欧洲古典油画风格"),
                    Map.of("key", "水彩", "name", "水彩", "description", "水彩画风格"),
                    Map.of("key", "素描", "name", "素描", "description", "铅笔素描风格")
            );

            return ApiResponse.success(styles);

        } catch (Exception e) {
            log.error("获取支持的风格列表异常", e);
            return ApiResponse.error("获取风格列表失败: " + e.getMessage());
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