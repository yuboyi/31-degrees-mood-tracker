package com.degrees31.aiplatform.service;

import com.degrees31.aiplatform.entity.AiTask;
import com.degrees31.aiplatform.util.BaiduAiUtil;

import java.util.List;

/**
 * AI任务服务接口
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
public interface AiTaskService {

    /**
     * 创建文生图任务
     * 
     * @param userId 用户ID
     * @param prompt 文本描述
     * @param negativePrompt 反向提示词
     * @param style 图片风格
     * @param width 图片宽度
     * @param height 图片高度
     * @return AI任务
     */
    AiTask createTextToImageTask(Long userId, String prompt, String negativePrompt, 
                                String style, Integer width, Integer height);

    /**
     * 创建图生图任务
     * 
     * @param userId 用户ID
     * @param prompt 文本描述
     * @param sourceImageUrl 原图URL
     * @param style 图片风格
     * @return AI任务
     */
    AiTask createImageToImageTask(Long userId, String prompt, String sourceImageUrl, String style);

    /**
     * 创建图转3D任务
     * 
     * @param userId 用户ID
     * @param sourceImageUrl 原图URL
     * @return AI任务
     */
    AiTask createImageTo3DTask(Long userId, String sourceImageUrl);

    /**
     * 执行AI任务
     * 
     * @param taskId 任务ID
     * @return 执行结果
     */
    boolean executeTask(Long taskId);

    /**
     * 异步执行AI任务
     * 
     * @param taskId 任务ID
     */
    void executeTaskAsync(Long taskId);

    /**
     * 处理文生图任务
     * 
     * @param task AI任务
     * @return 处理结果
     */
    BaiduAiUtil.AiGenerationResult processTextToImage(AiTask task);

    /**
     * 处理图生图任务
     * 
     * @param task AI任务
     * @return 处理结果
     */
    BaiduAiUtil.AiGenerationResult processImageToImage(AiTask task);

    /**
     * 处理图转3D任务
     * 
     * @param task AI任务
     * @return 处理结果
     */
    BaiduAiUtil.AiGenerationResult processImageTo3D(AiTask task);

    /**
     * 根据ID获取任务
     * 
     * @param taskId 任务ID
     * @return AI任务
     */
    AiTask getTaskById(Long taskId);

    /**
     * 获取用户的AI任务列表
     * 
     * @param userId 用户ID
     * @return 任务列表
     */
    List<AiTask> getUserTasks(Long userId);

    /**
     * 获取用户指定状态的任务列表
     * 
     * @param userId 用户ID
     * @param status 任务状态
     * @return 任务列表
     */
    List<AiTask> getUserTasksByStatus(Long userId, String status);

    /**
     * 获取用户指定类型的任务列表
     * 
     * @param userId 用户ID
     * @param taskType 任务类型
     * @return 任务列表
     */
    List<AiTask> getUserTasksByType(Long userId, String taskType);

    /**
     * 删除任务
     * 
     * @param taskId 任务ID
     * @param userId 用户ID
     * @return 是否删除成功
     */
    boolean deleteTask(Long taskId, Long userId);

    /**
     * 重试失败的任务
     * 
     * @param taskId 任务ID
     * @param userId 用户ID
     * @return 是否重试成功
     */
    boolean retryTask(Long taskId, Long userId);

    /**
     * 获取任务统计信息
     * 
     * @param userId 用户ID
     * @return 统计信息
     */
    TaskStats getTaskStats(Long userId);

    /**
     * 检查用户是否可以创建新任务
     * 
     * @param userId 用户ID
     * @return 是否可以创建
     */
    boolean canCreateTask(Long userId);

    /**
     * 处理超时的任务
     */
    void handleTimeoutTasks();

    /**
     * 清理失败的任务
     * 
     * @param days 保留天数
     */
    void cleanupFailedTasks(int days);

    /**
     * 任务统计信息
     */
    class TaskStats {
        private long totalTasks;
        private long completedTasks;
        private long failedTasks;
        private long processingTasks;
        private long totalCostPoints;

        // 构造器和getter/setter
        public TaskStats() {}

        public TaskStats(long totalTasks, long completedTasks, long failedTasks, long processingTasks, long totalCostPoints) {
            this.totalTasks = totalTasks;
            this.completedTasks = completedTasks;
            this.failedTasks = failedTasks;
            this.processingTasks = processingTasks;
            this.totalCostPoints = totalCostPoints;
        }

        // Getters and setters
        public long getTotalTasks() { return totalTasks; }
        public void setTotalTasks(long totalTasks) { this.totalTasks = totalTasks; }

        public long getCompletedTasks() { return completedTasks; }
        public void setCompletedTasks(long completedTasks) { this.completedTasks = completedTasks; }

        public long getFailedTasks() { return failedTasks; }
        public void setFailedTasks(long failedTasks) { this.failedTasks = failedTasks; }

        public long getProcessingTasks() { return processingTasks; }
        public void setProcessingTasks(long processingTasks) { this.processingTasks = processingTasks; }

        public long getTotalCostPoints() { return totalCostPoints; }
        public void setTotalCostPoints(long totalCostPoints) { this.totalCostPoints = totalCostPoints; }
    }
}