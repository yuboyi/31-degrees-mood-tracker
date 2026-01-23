package com.degrees31.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 角色实体类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("admin_role")
public class AdminRole {
    
    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 角色名称
     */
    @TableField("role_name")
    private String roleName;
    
    /**
     * 角色代码
     */
    @TableField("role_code")
    private String roleCode;
    
    /**
     * 角色描述
     */
    @TableField("description")
    private String description;
    
    /**
     * 状态（0-禁用，1-启用）
     */
    @TableField("status")
    private Integer status;
    
    /**
     * 排序号
     */
    @TableField("sort_order")
    private Integer sortOrder;
    
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