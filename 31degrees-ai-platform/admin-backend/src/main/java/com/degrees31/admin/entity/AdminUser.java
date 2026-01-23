package com.degrees31.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 管理员实体类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("admin_user")
public class AdminUser {
    
    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 用户名
     */
    @TableField("username")
    private String username;
    
    /**
     * 密码（加密存储）
     */
    @TableField("password")
    private String password;
    
    /**
     * 真实姓名
     */
    @TableField("real_name")
    private String realName;
    
    /**
     * 邮箱
     */
    @TableField("email")
    private String email;
    
    /**
     * 手机号
     */
    @TableField("phone")
    private String phone;
    
    /**
     * 头像URL
     */
    @TableField("avatar_url")
    private String avatarUrl;
    
    /**
     * 角色ID
     */
    @TableField("role_id")
    private Long roleId;
    
    /**
     * 角色名称（冗余字段，便于查询）
     */
    @TableField("role_name")
    private String roleName;
    
    /**
     * 状态（0-禁用，1-启用）
     */
    @TableField("status")
    private Integer status;
    
    /**
     * 最后登录时间
     */
    @TableField("last_login_time")
    private LocalDateTime lastLoginTime;
    
    /**
     * 最后登录IP
     */
    @TableField("last_login_ip")
    private String lastLoginIp;
    
    /**
     * 登录次数
     */
    @TableField("login_count")
    private Integer loginCount;
    
    /**
     * 创建时间
     */
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    
    /**
     * 更新时间
     */
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    
    /**
     * 创建者
     */
    @TableField("created_by")
    private String createdBy;
    
    /**
     * 更新者
     */
    @TableField("updated_by")
    private String updatedBy;
    
    /**
     * 备注
     */
    @TableField("remark")
    private String remark;
    
    /**
     * 逻辑删除（0-正常，1-删除）
     */
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}