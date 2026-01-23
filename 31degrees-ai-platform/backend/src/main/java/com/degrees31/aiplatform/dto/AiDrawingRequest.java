package com.degrees31.aiplatform.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * AI绘画请求DTO
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
public class AiDrawingRequest {

    /**
     * 文本描述（必填）
     */
    @NotBlank(message = "文本描述不能为空")
    @Size(max = 1000, message = "文本描述长度不能超过1000个字符")
    private String prompt;

    /**
     * 反向提示词（可选）
     */
    @Size(max = 500, message = "反向提示词长度不能超过500个字符")
    private String negativePrompt;

    /**
     * 图片风格（可选）
     */
    private String style = "写实";

    /**
     * 图片宽度（可选，默认512）
     */
    @Min(value = 256, message = "图片宽度不能小于256")
    @Max(value = 1024, message = "图片宽度不能大于1024")
    private Integer width = 512;

    /**
     * 图片高度（可选，默认512）
     */
    @Min(value = 256, message = "图片高度不能小于256")
    @Max(value = 1024, message = "图片高度不能大于1024")
    private Integer height = 512;

    /**
     * 原图URL（图生图时使用）
     */
    private String sourceImageUrl;

    /**
     * 原图Base64（图生图时使用，与sourceImageUrl二选一）
     */
    private String sourceImageBase64;

    /**
     * 图生图强度（0.1-1.0，默认0.7）
     */
    @Min(value = 0, message = "图生图强度不能小于0.1")
    @Max(value = 1, message = "图生图强度不能大于1.0")
    private Float strength = 0.7f;

    /**
     * AI服务提供商（可选，默认baidu）
     */
    private String aiProvider = "baidu";

    /**
     * 是否保存到用户相册（可选，默认true）
     */
    private Boolean saveToAlbum = true;

    /**
     * 验证文生图请求
     */
    public boolean isValidTextToImageRequest() {
        return prompt != null && !prompt.trim().isEmpty();
    }

    /**
     * 验证图生图请求
     */
    public boolean isValidImageToImageRequest() {
        return isValidTextToImageRequest() && 
               (sourceImageUrl != null && !sourceImageUrl.trim().isEmpty() ||
                sourceImageBase64 != null && !sourceImageBase64.trim().isEmpty());
    }

    /**
     * 获取任务类型
     */
    public String getTaskType() {
        if (sourceImageUrl != null || sourceImageBase64 != null) {
            return "image_to_image";
        } else {
            return "text_to_image";
        }
    }

    /**
     * 获取清理后的提示词
     */
    public String getCleanPrompt() {
        if (prompt == null) {
            return "";
        }
        return prompt.trim().replaceAll("\\s+", " ");
    }

    /**
     * 获取清理后的反向提示词
     */
    public String getCleanNegativePrompt() {
        if (negativePrompt == null || negativePrompt.trim().isEmpty()) {
            return null;
        }
        return negativePrompt.trim().replaceAll("\\s+", " ");
    }
}