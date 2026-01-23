package com.degrees31.aiplatform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 产品模板实体类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "product_templates")
public class ProductTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 模板名称
     */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * 分类：crystal, wood, metal
     */
    @Column(name = "category", nullable = false, length = 50)
    private String category;

    /**
     * 材质
     */
    @Column(name = "material", nullable = false, length = 50)
    private String material;

    /**
     * 尺寸规格（JSON格式）
     */
    @Column(name = "size_spec", nullable = false, columnDefinition = "JSON")
    private String sizeSpec;

    /**
     * 价格（分）
     */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * 预览图URL
     */
    @Column(name = "preview_image", nullable = false, length = 500)
    private String previewImage;

    /**
     * 描述
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 是否启用：0否，1是
     */
    @Column(name = "is_active")
    private Integer isActive = 1;

    /**
     * 排序
     */
    @Column(name = "sort_order")
    private Integer sortOrder = 0;

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

    // 产品分类枚举
    public enum Category {
        CRYSTAL("crystal", "水晶内雕"),
        WOOD("wood", "木质雕刻"),
        METAL("metal", "金属雕刻");

        private final String value;
        private final String description;

        Category(String value, String description) {
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
     * 是否启用
     */
    public boolean isActive() {
        return isActive == 1;
    }

    /**
     * 启用模板
     */
    public void enable() {
        this.isActive = 1;
    }

    /**
     * 禁用模板
     */
    public void disable() {
        this.isActive = 0;
    }

    /**
     * 获取分类描述
     */
    public String getCategoryDescription() {
        for (Category cat : Category.values()) {
            if (cat.getValue().equals(category)) {
                return cat.getDescription();
            }
        }
        return category;
    }

    /**
     * 获取价格（元）
     */
    public BigDecimal getPriceInYuan() {
        return price.divide(new BigDecimal("100"));
    }

    /**
     * 设置价格（元）
     */
    public void setPriceInYuan(BigDecimal priceInYuan) {
        this.price = priceInYuan.multiply(new BigDecimal("100"));
    }
}