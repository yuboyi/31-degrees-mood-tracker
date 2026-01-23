package com.degrees31.aiplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AI绘画响应DTO
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDrawingResponse {

    /**
     * 任务ID
     */
    private Long taskId;

    /**
     * 任务状态
     */
    private String status;

    /**
     * 任务类型
     */
    private String taskType;

    /**
     * 提示词
     */
    private String prompt;

    /**
     * 图片风格
     */
    private String style;

    /**
     * 图片宽度
     */
    private Integer width;

    /**
     * 图片高度
     */
    private Integer height;

    /**
     * 生成结果图片URL
     */
    private String resultImageUrl;

    /**
     * 原图URL（图生图）
     */
    private String sourceImageUrl;

    /**
     * AI服务提供商
     */
    private String aiProvider;

    /**
     * 处理耗时（秒）
     */
    private Integer processingTime;

    /**
     * 消耗积分
     */
    private Integer costPoints;

    /**
     * 错误信息
     */
    private String errorMessage;

    /**
     * 创建时间
     */
    private LocalDateTime createdTime;

    /**
     * 更新时间
     */
    private LocalDateTime updatedTime;

    /**
     * 是否完成
     */
    public boolean isCompleted() {
        return "completed".equals(status);
    }

    /**
     * 是否失败
     */
    public boolean isFailed() {
        return "failed".equals(status);
    }

    /**
     * 是否处理中
     */
    public boolean isProcessing() {
        return "processing".equals(status);
    }

    /**
     * 获取状态描述
     */
    public String getStatusDescription() {
        switch (status) {
            case "pending":
                return "等待处理";
            case "processing":
                return "处理中";
            case "completed":
                return "已完成";
            case "failed":
                return "处理失败";
            default:
                return status;
        }
    }

    /**
     * 获取任务类型描述
     */
    public String getTaskTypeDescription() {
        switch (taskType) {
            case "text_to_image":
                return "文生图";
            case "image_to_image":
                return "图生图";
            case "image_to_3d":
                return "图转3D";
            default:
                return taskType;
        }
    }

    /**
     * 创建成功响应
     */
    public static AiDrawingResponse fromTask(com.degrees31.aiplatform.entity.AiTask task) {
        return AiDrawingResponse.builder()
                .taskId(task.getId())
                .status(task.getStatus())
                .taskType(task.getTaskType())
                .prompt(task.getPrompt())
                .style(task.getStyle())
                .width(task.getWidth())
                .height(task.getHeight())
                .resultImageUrl(task.getResultImageUrl())
                .sourceImageUrl(task.getSourceImageUrl())
                .aiProvider(task.getAiProvider())
                .processingTime(task.getProcessingTime())
                .costPoints(task.getCostPoints())
                .errorMessage(task.getErrorMessage())
                .createdTime(task.getCreatedTime())
                .updatedTime(task.getUpdatedTime())
                .build();
    }

    /**
     * 创建处理中响应
     */
    public static AiDrawingResponse processing(Long taskId, String taskType) {
        return AiDrawingResponse.builder()
                .taskId(taskId)
                .status("processing")
                .taskType(taskType)
                .createdTime(LocalDateTime.now())
                .build();
    }

    /**
     * 创建失败响应
     */
    public static AiDrawingResponse failed(Long taskId, String taskType, String errorMessage) {
        return AiDrawingResponse.builder()
                .taskId(taskId)
                .status("failed")
                .taskType(taskType)
                .errorMessage(errorMessage)
                .updatedTime(LocalDateTime.now())
                .build();
    }
}