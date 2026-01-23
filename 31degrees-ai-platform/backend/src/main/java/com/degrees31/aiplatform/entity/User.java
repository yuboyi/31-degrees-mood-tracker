package com.degrees31.aiplatform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户实体类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 微信openid - 唯一标识
     */
    @Column(name = "openid", nullable = false, unique = true, length = 64)
    private String openid;

    /**
     * 微信unionid
     */
    @Column(name = "unionid", length = 64)
    private String unionid;

    /**
     * 用户昵称
     */
    @Column(name = "nickname", length = 50)
    private String nickname;

    /**
     * 头像URL
     */
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /**
     * 手机号
     */
    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * 性别：0未知，1男，2女
     */
    @Column(name = "gender")
    private Integer gender = 0;

    /**
     * 城市
     */
    @Column(name = "city", length = 50)
    private String city;

    /**
     * 省份
     */
    @Column(name = "province", length = 50)
    private String province;

    /**
     * 国家
     */
    @Column(name = "country", length = 50)
    private String country;

    /**
     * 语言
     */
    @Column(name = "language", length = 20)
    private String language = "zh_CN";

    /**
     * 用户状态：0禁用，1正常
     */
    @Column(name = "status")
    private Integer status = 1;

    /**
     * VIP等级：0普通，1白银，2黄金，3钻石
     */
    @Column(name = "vip_level")
    private Integer vipLevel = 0;

    /**
     * VIP过期时间
     */
    @Column(name = "vip_expire_time")
    private LocalDateTime vipExpireTime;

    /**
     * 总请求次数
     */
    @Column(name = "total_requests")
    private Integer totalRequests = 0;

    /**
     * 今日请求次数
     */
    @Column(name = "daily_requests")
    private Integer dailyRequests = 0;

    /**
     * 最后请求日期
     */
    @Column(name = "last_request_date")
    private LocalDate lastRequestDate;

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

    // 业务方法

    /**
     * 是否VIP用户
     */
    public boolean isVip() {
        return vipLevel > 0 && (vipExpireTime == null || vipExpireTime.isAfter(LocalDateTime.now()));
    }

    /**
     * 是否正常状态
     */
    public boolean isActive() {
        return status == 1;
    }

    /**
     * 增加请求次数
     */
    public void incrementRequests() {
        LocalDate today = LocalDate.now();
        if (!today.equals(lastRequestDate)) {
            // 新的一天，重置每日请求次数
            dailyRequests = 0;
            lastRequestDate = today;
        }
        dailyRequests++;
        totalRequests++;
    }

    /**
     * 获取用户显示名称
     */
    public String getDisplayName() {
        if (nickname != null && !nickname.trim().isEmpty()) {
            return nickname;
        }
        return "用户" + (id != null ? id.toString().substring(Math.max(0, id.toString().length() - 4)) : "");
    }
}