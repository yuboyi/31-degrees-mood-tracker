package com.degrees31.aiplatform.service.impl;

import com.degrees31.aiplatform.entity.AiTask;
import com.degrees31.aiplatform.repository.AiTaskRepository;
import com.degrees31.aiplatform.service.AiTaskService;
import com.degrees31.aiplatform.util.BaiduAiUtil;
import com.degrees31.aiplatform.util.OssUtil;
import com.degrees31.aiplatform.util.ImageProcessUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AI任务服务实现类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiTaskServiceImpl implements AiTaskService {

    private final AiTaskRepository aiTaskRepository;
    private final BaiduAiUtil baiduAiUtil;
    private final OssUtil ossUtil;
    private final ImageProcessUtil imageProcessUtil;

    @Value("${ai.baidu.text-to-image-points:10}")
    private int textToImagePoints;

    @Value("${ai.baidu.image-to-image-points:15}")
    private int imageToImagePoints;

    @Value("${ai.baidu.image-to-3d-points:50}")
    private int imageTo3dPoints;

    @Override
    @Transactional
    public AiTask createTextToImageTask(Long userId, String prompt, String negativePrompt, 
                                       String style, Integer width, Integer height) {
        try {
            AiTask task = new AiTask();
            task.setUserId(userId);
            task.setTaskType(AiTask.TaskType.TEXT_TO_IMAGE.getValue());
            task.setPrompt(prompt);
            task.setNegativePrompt(negativePrompt);
            task.setStyle(style);
            task.setWidth(width != null ? width : 512);
            task.setHeight(height != null ? height : 512);
            task.setAiProvider("baidu");
            task.setStatus(AiTask.TaskStatus.PENDING.getValue());
            task.setCostPoints(textToImagePoints);

            AiTask savedTask = aiTaskRepository.save(task);
            log.info("文生图任务创建成功，taskId: {}, userId: {}", savedTask.getId(), userId);
            
            return savedTask;
        } catch (Exception e) {
            log.error("创建文生图任务失败，userId: {}", userId, e);
            return null;
        }
    }

    @Override
    @Transactional
    public AiTask createImageToImageTask(Long userId, String prompt, String sourceImageUrl, String style) {
        try {
            AiTask task = new AiTask();
            task.setUserId(userId);
            task.setTaskType(AiTask.TaskType.IMAGE_TO_IMAGE.getValue());
            task.setPrompt(prompt);
            task.setSourceImageUrl(sourceImageUrl);
            task.setStyle(style);
            task.setAiProvider("baidu");
            task.setStatus(AiTask.TaskStatus.PENDING.getValue());
            task.setCostPoints(imageToImagePoints);

            AiTask savedTask = aiTaskRepository.save(task);
            log.info("图生图任务创建成功，taskId: {}, userId: {}", savedTask.getId(), userId);
            
            return savedTask;
        } catch (Exception e) {
            log.error("创建图生图任务失败，userId: {}", userId, e);
            return null;
        }
    }

    @Override
    @Transactional
    public AiTask createImageTo3DTask(Long userId, String sourceImageUrl) {
        try {
            AiTask task = new AiTask();
            task.setUserId(userId);
            task.setTaskType(AiTask.TaskType.IMAGE_TO_3D.getValue());
            task.setSourceImageUrl(sourceImageUrl);
            task.setAiProvider("custom"); // 使用自定义3D转换
            task.setStatus(AiTask.TaskStatus.PENDING.getValue());
            task.setCostPoints(imageTo3dPoints);

            AiTask savedTask = aiTaskRepository.save(task);
            log.info("图转3D任务创建成功，taskId: {}, userId: {}", savedTask.getId(), userId);
            
            return savedTask;
        } catch (Exception e) {
            log.error("创建图转3D任务失败，userId: {}", userId, e);
            return null;
        }
    }

    @Override
    @Transactional
    public boolean executeTask(Long taskId) {
        try {
            AiTask task = aiTaskRepository.findById(taskId).orElse(null);
            if (task == null) {
                log.error("任务不存在，taskId: {}", taskId);
                return false;
            }

            if (!AiTask.TaskStatus.PENDING.getValue().equals(task.getStatus())) {
                log.warn("任务状态不正确，taskId: {}, status: {}", taskId, task.getStatus());
                return false;
            }

            // 设置任务为处理中
            task.setProcessing();
            aiTaskRepository.save(task);

            // 根据任务类型执行相应的处理
            BaiduAiUtil.AiGenerationResult result;
            switch (task.getTaskType()) {
                case "text_to_image":
                    result = processTextToImage(task);
                    break;
                case "image_to_image":
                    result = processImageToImage(task);
                    break;
                case "image_to_3d":
                case "image_to_25d":
                    result = processImageTo3D(task);
                    break;
                default:
                    log.error("不支持的任务类型，taskId: {}, taskType: {}", taskId, task.getTaskType());
                    task.setFailed("不支持的任务类型");
                    aiTaskRepository.save(task);
                    return false;
            }

            // 处理执行结果
            if (result.isSuccess()) {
                // 上传生成的图片到OSS
                String imageUrl = uploadResultImage(result.getImageBase64(), task);
                if (imageUrl != null) {
                    task.setCompleted(imageUrl);
                    task.calculateProcessingTime();
                    aiTaskRepository.save(task);
                    
                    log.info("任务执行成功，taskId: {}, imageUrl: {}", taskId, imageUrl);
                    return true;
                } else {
                    task.setFailed("上传结果图片失败");
                    aiTaskRepository.save(task);
                    return false;
                }
            } else {
                task.setFailed(result.getMessage());
                aiTaskRepository.save(task);
                
                log.error("AI任务执行失败，taskId: {}, error: {}", taskId, result.getMessage());
                return false;
            }

        } catch (Exception e) {
            log.error("执行AI任务异常，taskId: {}", taskId, e);
            
            // 更新任务状态为失败
            try {
                AiTask task = aiTaskRepository.findById(taskId).orElse(null);
                if (task != null) {
                    task.setFailed("系统异常: " + e.getMessage());
                    aiTaskRepository.save(task);
                }
            } catch (Exception ex) {
                log.error("更新任务失败状态异常", ex);
            }
            
            return false;
        }
    }

    @Override
    @Async
    public void executeTaskAsync(Long taskId) {
        executeTask(taskId);
    }

    @Override
    public BaiduAiUtil.AiGenerationResult processTextToImage(AiTask task) {
        log.info("开始处理文生图任务，taskId: {}", task.getId());
        
        return baiduAiUtil.textToImage(
                task.getPrompt(),
                task.getNegativePrompt(),
                task.getStyle(),
                task.getWidth(),
                task.getHeight()
        );
    }

    @Override
    public BaiduAiUtil.AiGenerationResult processImageToImage(AiTask task) {
        log.info("开始处理图生图任务，taskId: {}", task.getId());
        
        try {
            // TODO: 从URL下载原图并转换为Base64
            // 这里需要实现图片下载和Base64转换功能
            String imageBase64 = downloadImageAsBase64(task.getSourceImageUrl());
            if (imageBase64 == null) {
                return BaiduAiUtil.AiGenerationResult.error("无法获取原图");
            }
            
            return baiduAiUtil.imageToImage(
                    task.getPrompt(),
                    imageBase64,
                    task.getStyle(),
                    0.7f // 默认强度
            );
        } catch (Exception e) {
            log.error("处理图生图任务异常，taskId: {}", task.getId(), e);
            return BaiduAiUtil.AiGenerationResult.error("处理图生图异常: " + e.getMessage());
        }
    }

    @Override
    public BaiduAiUtil.AiGenerationResult processImageTo3D(AiTask task) {
        log.info("开始处理图转3D任务，taskId: {}, taskType: {}", task.getId(), task.getTaskType());
        
        try {
            ImageProcessUtil.ImageProcessResult result;
            
            // 根据具体任务类型选择处理方法
            if ("image_to_25d".equals(task.getTaskType())) {
                result = imageProcessUtil.imageTo25D(task.getSourceImageUrl());
            } else {
                result = imageProcessUtil.imageTo3D(task.getSourceImageUrl());
            }
            
            if (result.isSuccess()) {
                // 转换为BaiduAiUtil.AiGenerationResult格式
                BaiduAiUtil.AiGenerationResult aiResult = BaiduAiUtil.AiGenerationResult.success();
                aiResult.setImageBase64(result.getResultBase64());
                return aiResult;
            } else {
                return BaiduAiUtil.AiGenerationResult.error(result.getMessage());
            }
            
        } catch (Exception e) {
            log.error("处理图转3D任务异常，taskId: {}", task.getId(), e);
            return BaiduAiUtil.AiGenerationResult.error("处理图转3D异常: " + e.getMessage());
        }
    }

    @Override
    public AiTask getTaskById(Long taskId) {
        return aiTaskRepository.findById(taskId).orElse(null);
    }

    @Override
    public List<AiTask> getUserTasks(Long userId) {
        return aiTaskRepository.findByUserIdOrderByCreatedTimeDesc(userId);
    }

    @Override
    public List<AiTask> getUserTasksByStatus(Long userId, String status) {
        return aiTaskRepository.findByUserIdAndStatusOrderByCreatedTimeDesc(userId, status);
    }

    @Override
    public List<AiTask> getUserTasksByType(Long userId, String taskType) {
        return aiTaskRepository.findByUserIdAndTaskTypeOrderByCreatedTimeDesc(userId, taskType);
    }

    @Override
    @Transactional
    public boolean deleteTask(Long taskId, Long userId) {
        try {
            AiTask task = aiTaskRepository.findById(taskId).orElse(null);
            if (task == null || !task.getUserId().equals(userId)) {
                return false;
            }

            // 删除相关文件
            if (task.getResultImageUrl() != null) {
                // TODO: 从URL提取objectKey并删除文件
                // deleteImageFromUrl(task.getResultImageUrl());
            }

            aiTaskRepository.deleteById(taskId);
            log.info("任务删除成功，taskId: {}, userId: {}", taskId, userId);
            
            return true;
        } catch (Exception e) {
            log.error("删除任务异常，taskId: {}, userId: {}", taskId, userId, e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean retryTask(Long taskId, Long userId) {
        try {
            AiTask task = aiTaskRepository.findById(taskId).orElse(null);
            if (task == null || !task.getUserId().equals(userId)) {
                return false;
            }

            if (!task.isFailed()) {
                log.warn("只能重试失败的任务，taskId: {}, status: {}", taskId, task.getStatus());
                return false;
            }

            // 重置任务状态
            task.setStatus(AiTask.TaskStatus.PENDING.getValue());
            task.setErrorMessage(null);
            task.setProcessingTime(null);
            task.setResultImageUrl(null);
            task.setUpdatedTime(LocalDateTime.now());

            aiTaskRepository.save(task);

            // 异步执行任务
            executeTaskAsync(taskId);

            log.info("任务重试成功，taskId: {}, userId: {}", taskId, userId);
            return true;

        } catch (Exception e) {
            log.error("重试任务异常，taskId: {}, userId: {}", taskId, userId, e);
            return false;
        }
    }

    @Override
    public TaskStats getTaskStats(Long userId) {
        try {
            List<AiTask> allTasks = getUserTasks(userId);
            
            long totalTasks = allTasks.size();
            long completedTasks = allTasks.stream().filter(AiTask::isCompleted).count();
            long failedTasks = allTasks.stream().filter(AiTask::isFailed).count();
            long processingTasks = allTasks.stream().filter(AiTask::isProcessing).count();
            
            Long totalCostPoints = aiTaskRepository.sumCostPointsByUserId(userId);
            if (totalCostPoints == null) {
                totalCostPoints = 0L;
            }

            return new TaskStats(totalTasks, completedTasks, failedTasks, processingTasks, totalCostPoints);

        } catch (Exception e) {
            log.error("获取任务统计异常，userId: {}", userId, e);
            return new TaskStats(0, 0, 0, 0, 0);
        }
    }

    @Override
    public boolean canCreateTask(Long userId) {
        // TODO: 根据用户等级和今日已使用次数判断
        return true;
    }

    @Override
    @Transactional
    public void handleTimeoutTasks() {
        try {
            // 处理超过30分钟仍在处理中的任务
            LocalDateTime timeoutTime = LocalDateTime.now().minusMinutes(30);
            List<AiTask> timeoutTasks = aiTaskRepository.findTimeoutProcessingTasks(timeoutTime);

            for (AiTask task : timeoutTasks) {
                task.setFailed("任务处理超时");
                aiTaskRepository.save(task);
            }

            if (!timeoutTasks.isEmpty()) {
                log.info("处理超时任务数量: {}", timeoutTasks.size());
            }

        } catch (Exception e) {
            log.error("处理超时任务异常", e);
        }
    }

    @Override
    @Transactional
    public void cleanupFailedTasks(int days) {
        try {
            LocalDateTime cutoffTime = LocalDateTime.now().minusDays(days);
            List<AiTask> failedTasks = aiTaskRepository.findFailedTasksForCleanup(cutoffTime);

            for (AiTask task : failedTasks) {
                aiTaskRepository.delete(task);
            }

            if (!failedTasks.isEmpty()) {
                log.info("清理过期失败任务数量: {}", failedTasks.size());
            }

        } catch (Exception e) {
            log.error("清理失败任务异常", e);
        }
    }

    /**
     * 上传结果图片到OSS
     */
    private String uploadResultImage(String imageBase64, AiTask task) {
        try {
            if (imageBase64 == null || imageBase64.trim().isEmpty()) {
                return null;
            }

            String folder = String.format("ai-results/user_%d", task.getUserId());
            OssUtil.UploadResult result = ossUtil.uploadBase64Image(imageBase64, folder);

            if (result.isSuccess()) {
                return result.getFileUrl();
            } else {
                log.error("上传AI结果图片失败，taskId: {}, error: {}", task.getId(), result.getMessage());
                return null;
            }

        } catch (Exception e) {
            log.error("上传AI结果图片异常，taskId: {}", task.getId(), e);
            return null;
        }
    }

    /**
     * 下载图片并转换为Base64
     */
    private String downloadImageAsBase64(String imageUrl) {
        // TODO: 实现图片下载和Base64转换
        // 这里需要添加HTTP客户端来下载图片
        log.warn("downloadImageAsBase64功能暂未实现，imageUrl: {}", imageUrl);
        return null;
    }
}