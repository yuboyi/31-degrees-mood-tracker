package com.degrees31.aiplatform.repository;

import com.degrees31.aiplatform.entity.AiTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * AI任务数据访问层
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Repository
public interface AiTaskRepository extends JpaRepository<AiTask, Long> {

    /**
     * 根据用户ID查找AI任务
     */
    List<AiTask> findByUserIdOrderByCreatedTimeDesc(Long userId);

    /**
     * 根据用户ID和任务状态查找AI任务
     */
    List<AiTask> findByUserIdAndStatusOrderByCreatedTimeDesc(Long userId, String status);

    /**
     * 根据任务类型查找AI任务
     */
    List<AiTask> findByTaskTypeOrderByCreatedTimeDesc(String taskType);

    /**
     * 根据用户ID和任务类型查找AI任务
     */
    List<AiTask> findByUserIdAndTaskTypeOrderByCreatedTimeDesc(Long userId, String taskType);

    /**
     * 查找用户指定日期的任务数量
     */
    @Query("SELECT COUNT(t) FROM AiTask t WHERE t.userId = :userId AND DATE(t.createdTime) = :date")
    long countByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    /**
     * 查找用户指定时间范围内的任务
     */
    @Query("SELECT t FROM AiTask t WHERE t.userId = :userId AND t.createdTime BETWEEN :startTime AND :endTime ORDER BY t.createdTime DESC")
    List<AiTask> findByUserIdAndCreatedTimeBetween(@Param("userId") Long userId, 
                                                  @Param("startTime") LocalDateTime startTime, 
                                                  @Param("endTime") LocalDateTime endTime);

    /**
     * 统计各任务状态的数量
     */
    @Query("SELECT t.status, COUNT(t) FROM AiTask t GROUP BY t.status")
    List<Object[]> countByStatus();

    /**
     * 统计各任务类型的数量
     */
    @Query("SELECT t.taskType, COUNT(t) FROM AiTask t GROUP BY t.taskType")
    List<Object[]> countByTaskType();

    /**
     * 查找处理中的任务
     */
    List<AiTask> findByStatusOrderByCreatedTimeAsc(String status);

    /**
     * 查找超时的处理中任务
     */
    @Query("SELECT t FROM AiTask t WHERE t.status = 'processing' AND t.updatedTime < :timeoutTime")
    List<AiTask> findTimeoutProcessingTasks(@Param("timeoutTime") LocalDateTime timeoutTime);

    /**
     * 统计用户各类型任务数量
     */
    @Query("SELECT t.taskType, COUNT(t) FROM AiTask t WHERE t.userId = :userId GROUP BY t.taskType")
    List<Object[]> countByUserIdAndTaskType(@Param("userId") Long userId);

    /**
     * 查找最近N天的任务统计
     */
    @Query("SELECT DATE(t.createdTime) as date, COUNT(t) as count FROM AiTask t WHERE t.createdTime >= :startDate GROUP BY DATE(t.createdTime) ORDER BY date DESC")
    List<Object[]> getTaskStatsByRecentDays(@Param("startDate") LocalDateTime startDate);

    /**
     * 查找用户最近的任务
     */
    @Query("SELECT t FROM AiTask t WHERE t.userId = :userId ORDER BY t.createdTime DESC")
    List<AiTask> findRecentTasksByUserId(@Param("userId") Long userId, org.springframework.data.domain.Pageable pageable);

    /**
     * 查找成功完成的任务
     */
    @Query("SELECT t FROM AiTask t WHERE t.status = 'completed' AND t.resultImageUrl IS NOT NULL ORDER BY t.createdTime DESC")
    List<AiTask> findCompletedTasksWithResults(org.springframework.data.domain.Pageable pageable);

    /**
     * 统计用户总消耗积分
     */
    @Query("SELECT SUM(t.costPoints) FROM AiTask t WHERE t.userId = :userId")
    Long sumCostPointsByUserId(@Param("userId") Long userId);

    /**
     * 查找需要清理的失败任务（超过指定天数）
     */
    @Query("SELECT t FROM AiTask t WHERE t.status = 'failed' AND t.createdTime < :cutoffTime")
    List<AiTask> findFailedTasksForCleanup(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * 按AI服务提供商统计任务数量
     */
    @Query("SELECT t.aiProvider, COUNT(t) FROM AiTask t GROUP BY t.aiProvider")
    List<Object[]> countByAiProvider();

    /**
     * 查找指定用户的热门提示词
     */
    @Query("SELECT t.prompt, COUNT(t) as count FROM AiTask t WHERE t.userId = :userId AND t.prompt IS NOT NULL GROUP BY t.prompt ORDER BY count DESC")
    List<Object[]> findPopularPromptsByUserId(@Param("userId") Long userId, org.springframework.data.domain.Pageable pageable);

    /**
     * 查找全局热门提示词
     */
    @Query("SELECT t.prompt, COUNT(t) as count FROM AiTask t WHERE t.prompt IS NOT NULL AND t.status = 'completed' GROUP BY t.prompt ORDER BY count DESC")
    List<Object[]> findGlobalPopularPrompts(org.springframework.data.domain.Pageable pageable);

    /**
     * 统计平均处理时间
     */
    @Query("SELECT AVG(t.processingTime) FROM AiTask t WHERE t.processingTime IS NOT NULL AND t.status = 'completed'")
    Double getAverageProcessingTime();

    /**
     * 按任务类型统计平均处理时间
     */
    @Query("SELECT t.taskType, AVG(t.processingTime) FROM AiTask t WHERE t.processingTime IS NOT NULL AND t.status = 'completed' GROUP BY t.taskType")
    List<Object[]> getAverageProcessingTimeByTaskType();
}