package com.degrees31.aiplatform.repository;

import com.degrees31.aiplatform.entity.VipOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * VIP订单数据访问层
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Repository
public interface VipOrderRepository extends JpaRepository<VipOrder, Long> {
    
    /**
     * 根据订单号查找订单
     */
    VipOrder findByOrderNo(String orderNo);
    
    /**
     * 根据用户ID查找订单列表
     */
    List<VipOrder> findByUserIdAndDeletedFalseOrderByCreatedTimeDesc(Long userId);
    
    /**
     * 根据用户ID和订单状态查找订单
     */
    List<VipOrder> findByUserIdAndStatusAndDeletedFalseOrderByCreatedTimeDesc(Long userId, String status);
    
    /**
     * 查找用户最新的已支付订单
     */
    @Query("SELECT o FROM VipOrder o WHERE o.userId = :userId AND o.status = 'PAID' AND o.deleted = false ORDER BY o.payTime DESC")
    List<VipOrder> findLatestPaidOrdersByUserId(@Param("userId") Long userId);
    
    /**
     * 查找过期的订单
     */
    @Query("SELECT o FROM VipOrder o WHERE o.status = 'PENDING' AND o.createdTime < :expireTime AND o.deleted = false")
    List<VipOrder> findExpiredOrders(@Param("expireTime") LocalDateTime expireTime);
    
    /**
     * 统计用户订单数量
     */
    long countByUserIdAndDeletedFalse(Long userId);
    
    /**
     * 统计指定状态的订单数量
     */
    long countByStatusAndDeletedFalse(String status);
    
    /**
     * 查找指定时间范围内的订单
     */
    @Query("SELECT o FROM VipOrder o WHERE o.createdTime BETWEEN :startTime AND :endTime AND o.deleted = false ORDER BY o.createdTime DESC")
    List<VipOrder> findOrdersBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查找需要处理的支付成功订单
     */
    @Query("SELECT o FROM VipOrder o WHERE o.status = 'PAID' AND o.validFrom <= :now AND o.validTo > :now AND o.deleted = false")
    List<VipOrder> findActiveVipOrders(@Param("now") LocalDateTime now);
}