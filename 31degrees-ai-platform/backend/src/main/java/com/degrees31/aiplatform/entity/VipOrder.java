package com.degrees31.aiplatform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * VIP订单实体类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "vip_order")
@EntityListeners(AuditingEntityListener.class)
public class VipOrder {
    
    /**
     * 订单ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 订单号
     */
    @Column(name = "order_no", unique = true, nullable = false, length = 32)
    private String orderNo;
    
    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    /**
     * VIP类型 (VIP, PREMIUM)
     */
    @Column(name = "vip_type", nullable = false, length = 20)
    private String vipType;
    
    /**
     * 购买时长（月数）
     */
    @Column(name = "duration_months", nullable = false)
    private Integer durationMonths;
    
    /**
     * 商品名称
     */
    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;
    
    /**
     * 原价
     */
    @Column(name = "original_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal originalPrice;
    
    /**
     * 折扣金额
     */
    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount;
    
    /**
     * 实付金额
     */
    @Column(name = "final_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal finalAmount;
    
    /**
     * 支付方式
     */
    @Column(name = "pay_method", length = 20)
    private String payMethod;
    
    /**
     * 微信支付交易号
     */
    @Column(name = "wx_transaction_id", length = 50)
    private String wxTransactionId;
    
    /**
     * 微信支付商户订单号
     */
    @Column(name = "wx_out_trade_no", length = 50)
    private String wxOutTradeNo;
    
    /**
     * 订单状态
     * PENDING: 待支付
     * PAID: 已支付
     * CANCELLED: 已取消
     * REFUNDED: 已退款
     * EXPIRED: 已过期
     */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";
    
    /**
     * VIP生效时间
     */
    @Column(name = "valid_from")
    private LocalDateTime validFrom;
    
    /**
     * VIP到期时间
     */
    @Column(name = "valid_to")
    private LocalDateTime validTo;
    
    /**
     * 支付时间
     */
    @Column(name = "pay_time")
    private LocalDateTime payTime;
    
    /**
     * 退款时间
     */
    @Column(name = "refund_time")
    private LocalDateTime refundTime;
    
    /**
     * 退款金额
     */
    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;
    
    /**
     * 退款原因
     */
    @Column(name = "refund_reason", length = 500)
    private String refundReason;
    
    /**
     * 备注
     */
    @Column(name = "remark", length = 500)
    private String remark;
    
    /**
     * 创建时间
     */
    @CreatedDate
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
    
    /**
     * 更新时间
     */
    @LastModifiedDate
    @Column(name = "updated_time", nullable = false)
    private LocalDateTime updatedTime;
    
    /**
     * 逻辑删除标记
     */
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
}