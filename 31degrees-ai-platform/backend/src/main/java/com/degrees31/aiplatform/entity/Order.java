package com.degrees31.aiplatform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单实体类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 订单号
     */
    @Column(name = "order_no", nullable = false, unique = true, length = 32)
    private String orderNo;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * AI任务ID
     */
    @Column(name = "ai_task_id")
    private Long aiTaskId;

    /**
     * 产品类型：digital, physical
     */
    @Column(name = "product_type", nullable = false, length = 20)
    private String productType;

    /**
     * 产品名称
     */
    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    /**
     * 产品规格（JSON格式）
     */
    @Column(name = "product_spec", columnDefinition = "JSON")
    private String productSpec;

    /**
     * 产品图片URL
     */
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    /**
     * 数量
     */
    @Column(name = "quantity")
    private Integer quantity = 1;

    /**
     * 单价（分）
     */
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    /**
     * 总金额（分）
     */
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    /**
     * 运费（分）
     */
    @Column(name = "shipping_fee", precision = 10, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    /**
     * 优惠金额（分）
     */
    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /**
     * 实付金额（分）
     */
    @Column(name = "final_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal finalAmount;

    /**
     * 订单状态：unpaid, paid, processing, shipped, completed, cancelled
     */
    @Column(name = "status", length = 20)
    private String status = "unpaid";

    /**
     * 支付方式：wechat_pay
     */
    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    /**
     * 支付时间
     */
    @Column(name = "payment_time")
    private LocalDateTime paymentTime;

    /**
     * 收货地址（JSON格式）
     */
    @Column(name = "shipping_address", columnDefinition = "JSON")
    private String shippingAddress;

    /**
     * 发货时间
     */
    @Column(name = "shipping_time")
    private LocalDateTime shippingTime;

    /**
     * 物流单号
     */
    @Column(name = "tracking_number", length = 50)
    private String trackingNumber;

    /**
     * 完成时间
     */
    @Column(name = "completed_time")
    private LocalDateTime completedTime;

    /**
     * 备注
     */
    @Column(name = "remark", length = 500)
    private String remark;

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

    /**
     * 关联AI任务
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_task_id", insertable = false, updatable = false)
    private AiTask aiTask;

    // 订单状态枚举
    public enum OrderStatus {
        UNPAID("unpaid", "待付款"),
        PAID("paid", "已付款"),
        PROCESSING("processing", "制作中"),
        SHIPPED("shipped", "已发货"),
        COMPLETED("completed", "已完成"),
        CANCELLED("cancelled", "已取消");

        private final String value;
        private final String description;

        OrderStatus(String value, String description) {
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

    // 产品类型枚举
    public enum ProductType {
        DIGITAL("digital", "数字产品"),
        PHYSICAL("physical", "实物产品");

        private final String value;
        private final String description;

        ProductType(String value, String description) {
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
     * 是否已支付
     */
    public boolean isPaid() {
        return !OrderStatus.UNPAID.getValue().equals(status);
    }

    /**
     * 是否数字产品
     */
    public boolean isDigital() {
        return ProductType.DIGITAL.getValue().equals(productType);
    }

    /**
     * 是否实物产品
     */
    public boolean isPhysical() {
        return ProductType.PHYSICAL.getValue().equals(productType);
    }

    /**
     * 支付订单
     */
    public void pay(String paymentMethod) {
        this.status = OrderStatus.PAID.getValue();
        this.paymentMethod = paymentMethod;
        this.paymentTime = LocalDateTime.now();
    }

    /**
     * 发货
     */
    public void ship(String trackingNumber) {
        this.status = OrderStatus.SHIPPED.getValue();
        this.trackingNumber = trackingNumber;
        this.shippingTime = LocalDateTime.now();
    }

    /**
     * 完成订单
     */
    public void complete() {
        this.status = OrderStatus.COMPLETED.getValue();
        this.completedTime = LocalDateTime.now();
    }

    /**
     * 取消订单
     */
    public void cancel() {
        this.status = OrderStatus.CANCELLED.getValue();
    }

    /**
     * 计算最终金额
     */
    public void calculateFinalAmount() {
        this.finalAmount = totalAmount.add(shippingFee).subtract(discountAmount);
    }

    /**
     * 生成订单号
     */
    public static String generateOrderNo() {
        return "OD" + System.currentTimeMillis() + String.format("%04d", (int)(Math.random() * 10000));
    }

    /**
     * 获取订单状态描述
     */
    public String getStatusDescription() {
        for (OrderStatus orderStatus : OrderStatus.values()) {
            if (orderStatus.getValue().equals(status)) {
                return orderStatus.getDescription();
            }
        }
        return status;
    }
}