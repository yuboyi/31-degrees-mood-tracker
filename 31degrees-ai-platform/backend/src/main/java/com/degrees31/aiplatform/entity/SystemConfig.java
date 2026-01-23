package com.degrees31.aiplatform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 系统配置实体类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "system_configs")
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 配置键
     */
    @Column(name = "config_key", nullable = false, unique = true, length = 100)
    private String configKey;

    /**
     * 配置值
     */
    @Column(name = "config_value", nullable = false, columnDefinition = "TEXT")
    private String configValue;

    /**
     * 配置类型：string, number, json, boolean
     */
    @Column(name = "config_type", length = 20)
    private String configType = "string";

    /**
     * 描述
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * 是否系统配置：0否，1是
     */
    @Column(name = "is_system")
    private Integer isSystem = 0;

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

    // 配置类型枚举
    public enum ConfigType {
        STRING("string", "字符串"),
        NUMBER("number", "数字"),
        JSON("json", "JSON对象"),
        BOOLEAN("boolean", "布尔值");

        private final String value;
        private final String description;

        ConfigType(String value, String description) {
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
     * 是否系统配置
     */
    public boolean isSystem() {
        return isSystem == 1;
    }

    /**
     * 获取字符串值
     */
    public String getStringValue() {
        return configValue;
    }

    /**
     * 获取数字值
     */
    public Integer getIntValue() {
        try {
            return Integer.valueOf(configValue);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 获取长整型值
     */
    public Long getLongValue() {
        try {
            return Long.valueOf(configValue);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 获取浮点数值
     */
    public Double getDoubleValue() {
        try {
            return Double.valueOf(configValue);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 获取布尔值
     */
    public Boolean getBooleanValue() {
        return "true".equalsIgnoreCase(configValue) || "1".equals(configValue);
    }

    /**
     * 设置字符串值
     */
    public void setStringValue(String value) {
        this.configValue = value;
        this.configType = ConfigType.STRING.getValue();
    }

    /**
     * 设置数字值
     */
    public void setNumberValue(Number value) {
        this.configValue = value.toString();
        this.configType = ConfigType.NUMBER.getValue();
    }

    /**
     * 设置布尔值
     */
    public void setBooleanValue(Boolean value) {
        this.configValue = value.toString();
        this.configType = ConfigType.BOOLEAN.getValue();
    }

    /**
     * 设置JSON值
     */
    public void setJsonValue(String value) {
        this.configValue = value;
        this.configType = ConfigType.JSON.getValue();
    }

    /**
     * 构造器方法 - 创建字符串配置
     */
    public static SystemConfig createString(String key, String value, String description) {
        SystemConfig config = new SystemConfig();
        config.setConfigKey(key);
        config.setStringValue(value);
        config.setDescription(description);
        return config;
    }

    /**
     * 构造器方法 - 创建数字配置
     */
    public static SystemConfig createNumber(String key, Number value, String description) {
        SystemConfig config = new SystemConfig();
        config.setConfigKey(key);
        config.setNumberValue(value);
        config.setDescription(description);
        return config;
    }

    /**
     * 构造器方法 - 创建布尔配置
     */
    public static SystemConfig createBoolean(String key, Boolean value, String description) {
        SystemConfig config = new SystemConfig();
        config.setConfigKey(key);
        config.setBooleanValue(value);
        config.setDescription(description);
        return config;
    }

    /**
     * 构造器方法 - 创建系统配置
     */
    public static SystemConfig createSystemConfig(String key, String value, String type, String description) {
        SystemConfig config = new SystemConfig();
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setConfigType(type);
        config.setDescription(description);
        config.setIsSystem(1);
        return config;
    }
}