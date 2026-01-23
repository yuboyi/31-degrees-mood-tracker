package com.degrees31.aiplatform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * AI任务实体类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "ai_tasks")
public class AiTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 任务类型：text_to_image, image_to_image, image_to_3d
     */
    @Column(name = "task_type", nullable = false, length = 20)
    private String taskType;

    /**
     * 文本描述
     */
    @Column(name = "prompt", columnDefinition = "TEXT")
    private String prompt;

    /**
     * 反向提示词
     */
    @Column(name = "negative_prompt", columnDefinition = "TEXT")
    private String negativePrompt;

    /**
     * 图片风格：写实、动漫、国风等
     */
    @Column(name = "style", length = 50)
    private String style;

    /**
     * 图片宽度
     */
    @Column(name = "width")
    private Integer width = 512;

    /**
     * 图片高度
     */
    @Column(name = "height")
    private Integer height = 512;

    /**
     * 原图URL（图生图使用）
     */
    @Column(name = "source_image_url", length = 500)
    private String sourceImageUrl;

    /**
     * 生成结果图片URL
     */
    @Column(name = "result_image_url", length = 500)
    private String resultImageUrl;

    /**
     * 3D模型结果URL
     */
    @Column(name = "result_3d_url", length = 500)
    private String result3dUrl;

    /**
     * AI服务提供商：baidu, aliyun
     */
    @Column(name = "ai_provider", length = 20)
    private String aiProvider = "baidu";

    /**
     * AI模型名称
     */
    @Column(name = "ai_model", length = 50)
    private String aiModel;

    /**
     * 任务状态：pending, processing, completed, failed
     */
    @Column(name = "status", length = 20)
    private String status = "pending";

    /**
     * 错误信息
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * 处理耗时（秒）
     */
    @Column(name = "processing_time")
    private Integer processingTime;

    /**
     * 消耗积分
     */
    @Column(name = "cost_points")
    private Integer costPoints = 0;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;

    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "updated_time", nullable = false)
    private LocalDateTime updatedTime;

    // 关联关系

    /**
     * 关联用户
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    // 任务状态枚举
    public enum TaskStatus {
        PENDING("pending", "等待中"),
        PROCESSING("processing", "处理中"),
        COMPLETED("completed", "已完成"),
        FAILED("failed", "失败");

        private final String value;
        private final String description;

        TaskStatus(String value, String description) {
            this.value = value;
            this.description = description;
        }

        public String getValue() {
            return value;
        }

        public String getDescription() {
            return description;
        }
    }

    // 任务类型枚举
    public enum TaskType {
        TEXT_TO_IMAGE("text_to_image", "文生图"),
        IMAGE_TO_IMAGE("image_to_image", "图生图"),
        IMAGE_TO_3D("image_to_3d", "图转3D");

        private final String value;
        private final String description;

        TaskType(String value, String description) {
            this.value = value;
            this.description = description;
        }

        public String getValue() {
            return value;
        }

        public String getDescription() {
            return description;
        }
    }

    // 业务方法

    /**
     * 是否完成
     */
    public boolean isCompleted() {
        return TaskStatus.COMPLETED.getValue().equals(status);
    }

    /**
     * 是否失败
     */
    public boolean isFailed() {
        return TaskStatus.FAILED.getValue().equals(status);
    }

    /**
     * 是否处理中
     */
    public boolean isProcessing() {
        return TaskStatus.PROCESSING.getValue().equals(status);
    }

    /**
     * 设置为处理中
     */
    public void setProcessing() {
        this.status = TaskStatus.PROCESSING.getValue();
    }

    /**
     * 设置为完成
     */
    public void setCompleted(String resultUrl) {
        this.status = TaskStatus.COMPLETED.getValue();
        if (TaskType.IMAGE_TO_3D.getValue().equals(taskType)) {
            this.result3dUrl = resultUrl;
        } else {
            this.resultImageUrl = resultUrl;
        }
    }

    /**
     * 设置为失败
     */
    public void setFailed(String errorMessage) {
        this.status = TaskStatus.FAILED.getValue();
        this.errorMessage = errorMessage;
    }

    /**
     * 计算处理时间
     */
    public void calculateProcessingTime() {
        if (createdTime != null && updatedTime != null) {
            this.processingTime = (int) java.time.Duration.between(createdTime, updatedTime).getSeconds();
        }
    }
}