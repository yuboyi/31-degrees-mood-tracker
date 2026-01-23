-- 31度文创精灵管理后台数据库表初始化脚本
-- 执行前请确保已连接到 ai_platform 数据库

USE ai_platform;

-- ============================================
-- 管理员角色表
-- ============================================
DROP TABLE IF EXISTS `admin_role`;
CREATE TABLE `admin_role` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_name` varchar(50) NOT NULL COMMENT '角色名称',
  `role_code` varchar(50) NOT NULL COMMENT '角色代码',
  `description` varchar(200) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态（0-禁用，1-启用）',
  `sort_order` int DEFAULT '0' COMMENT '排序号',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` varchar(50) DEFAULT NULL COMMENT '创建者',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '更新者',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除（0-正常，1-删除）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  KEY `idx_status` (`status`),
  KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员角色表';

-- ============================================
-- 管理员用户表
-- ============================================
DROP TABLE IF EXISTS `admin_user`;
CREATE TABLE `admin_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码（加密存储）',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT '头像URL',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `role_name` varchar(50) DEFAULT NULL COMMENT '角色名称（冗余字段）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态（0-禁用，1-启用）',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `login_count` int NOT NULL DEFAULT '0' COMMENT '登录次数',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` varchar(50) DEFAULT NULL COMMENT '创建者',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '更新者',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除（0-正常，1-删除）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_time` (`created_time`),
  CONSTRAINT `fk_admin_user_role` FOREIGN KEY (`role_id`) REFERENCES `admin_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员用户表';

-- ============================================
-- 管理员权限表
-- ============================================
DROP TABLE IF EXISTS `admin_permission`;
CREATE TABLE `admin_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `permission_name` varchar(100) NOT NULL COMMENT '权限名称',
  `permission_code` varchar(100) NOT NULL COMMENT '权限代码',
  `permission_type` varchar(20) NOT NULL DEFAULT 'MENU' COMMENT '权限类型（MENU-菜单，BUTTON-按钮，API-接口）',
  `parent_id` bigint DEFAULT '0' COMMENT '父权限ID',
  `path` varchar(200) DEFAULT NULL COMMENT '路径',
  `component` varchar(100) DEFAULT NULL COMMENT '组件',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `sort_order` int DEFAULT '0' COMMENT '排序号',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态（0-禁用，1-启用）',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` varchar(50) DEFAULT NULL COMMENT '创建者',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '更新者',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除（0-正常，1-删除）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`permission_code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员权限表';

-- ============================================
-- 角色权限关联表
-- ============================================
DROP TABLE IF EXISTS `admin_role_permission`;
CREATE TABLE `admin_role_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `permission_id` bigint NOT NULL COMMENT '权限ID',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(50) DEFAULT NULL COMMENT '创建者',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `admin_role` (`id`),
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `admin_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ============================================
-- 管理员操作日志表
-- ============================================
DROP TABLE IF EXISTS `admin_operation_log`;
CREATE TABLE `admin_operation_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_id` bigint DEFAULT NULL COMMENT '管理员ID',
  `admin_name` varchar(50) DEFAULT NULL COMMENT '管理员用户名',
  `operation_type` varchar(50) NOT NULL COMMENT '操作类型',
  `operation_desc` varchar(200) DEFAULT NULL COMMENT '操作描述',
  `request_method` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `request_url` varchar(500) DEFAULT NULL COMMENT '请求URL',
  `request_params` text DEFAULT NULL COMMENT '请求参数',
  `response_data` text DEFAULT NULL COMMENT '响应数据',
  `ip_address` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `execute_time` int DEFAULT NULL COMMENT '执行时间（毫秒）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态（0-失败，1-成功）',
  `error_msg` text DEFAULT NULL COMMENT '错误信息',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- ============================================
-- 系统配置表
-- ============================================
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text DEFAULT NULL COMMENT '配置值',
  `config_desc` varchar(200) DEFAULT NULL COMMENT '配置描述',
  `config_type` varchar(20) NOT NULL DEFAULT 'STRING' COMMENT '配置类型（STRING-字符串，NUMBER-数字，BOOLEAN-布尔值，JSON-JSON对象）',
  `is_system` tinyint NOT NULL DEFAULT '0' COMMENT '是否系统配置（0-否，1-是）',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` varchar(50) DEFAULT NULL COMMENT '创建者',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '更新者',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`),
  KEY `idx_config_type` (`config_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 初始化基础数据
-- ============================================

-- 插入默认角色
INSERT INTO `admin_role` (`role_name`, `role_code`, `description`, `status`, `sort_order`, `created_by`) VALUES
('超级管理员', 'SUPER_ADMIN', '系统超级管理员，拥有所有权限', 1, 1, 'system'),
('管理员', 'ADMIN', '普通管理员，拥有基础管理权限', 1, 2, 'system'),
('运营人员', 'OPERATOR', '运营人员，拥有用户和内容管理权限', 1, 3, 'system');

-- 插入默认权限
INSERT INTO `admin_permission` (`permission_name`, `permission_code`, `permission_type`, `parent_id`, `path`, `icon`, `sort_order`, `created_by`) VALUES
('系统管理', 'system', 'MENU', 0, '/system', 'fas fa-cog', 1, 'system'),
('用户管理', 'user:list', 'MENU', 0, '/users', 'fas fa-users', 2, 'system'),
('AI任务管理', 'task:list', 'MENU', 0, '/tasks', 'fas fa-tasks', 3, 'system'),
('订单管理', 'order:list', 'MENU', 0, '/orders', 'fas fa-shopping-cart', 4, 'system'),
('数据统计', 'statistics:view', 'MENU', 0, '/statistics', 'fas fa-chart-bar', 5, 'system'),
('管理员管理', 'admin:list', 'MENU', 1, '/system/admins', 'fas fa-user-shield', 11, 'system'),
('角色管理', 'role:list', 'MENU', 1, '/system/roles', 'fas fa-users-cog', 12, 'system'),
('权限管理', 'permission:list', 'MENU', 1, '/system/permissions', 'fas fa-key', 13, 'system'),
('系统配置', 'config:list', 'MENU', 1, '/system/config', 'fas fa-cogs', 14, 'system'),
('操作日志', 'log:list', 'MENU', 1, '/system/logs', 'fas fa-history', 15, 'system');

-- 插入默认管理员用户（密码：admin123）
INSERT INTO `admin_user` (`username`, `password`, `real_name`, `email`, `role_id`, `role_name`, `status`, `created_by`) VALUES
('admin', '$2a$10$7JB720yubVSaD6VzwSfXH.qOnnqc.rRXqzeg6DHVNDXZFp9mBJlrW', '超级管理员', 'admin@31degrees.com', 1, '超级管理员', 1, 'system');

-- 给超级管理员分配所有权限
INSERT INTO `admin_role_permission` (`role_id`, `permission_id`, `created_by`)
SELECT 1, id, 'system' FROM `admin_permission`;

-- 插入默认系统配置
INSERT INTO `system_config` (`config_key`, `config_value`, `config_desc`, `config_type`, `is_system`, `created_by`) VALUES
('system.name', '31度文创精灵管理后台', '系统名称', 'STRING', 1, 'system'),
('system.version', '1.0.0', '系统版本', 'STRING', 1, 'system'),
('system.copyright', '© 2025 31度团队. All rights reserved.', '版权信息', 'STRING', 1, 'system'),
('user.default.daily_limit', '10', '普通用户默认每日使用次数', 'NUMBER', 1, 'system'),
('user.vip.daily_limit', '100', 'VIP用户每日使用次数', 'NUMBER', 1, 'system'),
('file.upload.max_size', '50', '文件上传最大大小(MB)', 'NUMBER', 1, 'system'),
('ai.text_to_image.cost', '1', '文生图消耗点数', 'NUMBER', 1, 'system'),
('ai.image_to_image.cost', '1', '图生图消耗点数', 'NUMBER', 1, 'system'),
('ai.image_to_25d.cost', '2', '图转2.5D消耗点数', 'NUMBER', 1, 'system'),
('ai.image_to_3d.cost', '5', '图转3D消耗点数', 'NUMBER', 1, 'system');

-- 提交事务
COMMIT;