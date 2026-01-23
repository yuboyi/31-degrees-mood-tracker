-- 创建31度文创精灵AI平台数据库
-- 注意：数据库已在docker-compose中创建，这里主要是建表和初始化数据

-- 使用utf8mb4字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `openid` varchar(128) NOT NULL UNIQUE COMMENT '微信openid',
    `unionid` varchar(128) DEFAULT NULL COMMENT '微信unionid',
    `nickname` varchar(64) NOT NULL COMMENT '用户昵称',
    `avatar_url` varchar(512) DEFAULT NULL COMMENT '头像URL',
    `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
    `vip_level` varchar(20) NOT NULL DEFAULT 'NORMAL' COMMENT 'VIP等级：NORMAL-普通用户，VIP-VIP会员，PREMIUM-尊享会员',
    `vip_expire_time` datetime DEFAULT NULL COMMENT 'VIP到期时间',
    `daily_requests_limit` int NOT NULL DEFAULT 10 COMMENT '每日请求次数限制',
    `total_requests` int NOT NULL DEFAULT 0 COMMENT '总请求次数',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `register_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_openid` (`openid`),
    KEY `idx_phone` (`phone`),
    KEY `idx_vip_level` (`vip_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- AI任务表
CREATE TABLE IF NOT EXISTS `ai_task` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `task_type` varchar(50) NOT NULL COMMENT '任务类型：TEXT_TO_IMAGE-文生图，IMAGE_TO_IMAGE-图生图，IMAGE_TO_25D-图转2.5D，IMAGE_TO_3D-图转3D',
    `prompt` text NOT NULL COMMENT '提示词',
    `negative_prompt` text DEFAULT NULL COMMENT '负面提示词',
    `style` varchar(50) DEFAULT NULL COMMENT '艺术风格',
    `width` int DEFAULT 512 COMMENT '图片宽度',
    `height` int DEFAULT 512 COMMENT '图片高度',
    `source_image_url` varchar(512) DEFAULT NULL COMMENT '源图片URL（图生图时使用）',
    `result_image_url` varchar(512) DEFAULT NULL COMMENT '结果图片URL',
    `ai_task_id` varchar(128) DEFAULT NULL COMMENT 'AI平台返回的任务ID',
    `status` varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING-待处理，PROCESSING-处理中，COMPLETED-已完成，FAILED-失败',
    `error_message` text DEFAULT NULL COMMENT '错误信息',
    `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `completed_time` datetime DEFAULT NULL COMMENT '完成时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_task_type` (`task_type`),
    KEY `idx_status` (`status`),
    KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI任务表';

-- VIP订单表
CREATE TABLE IF NOT EXISTS `vip_order` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `order_no` varchar(64) NOT NULL UNIQUE COMMENT '订单号',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `vip_level` varchar(20) NOT NULL COMMENT 'VIP等级',
    `duration_months` int NOT NULL COMMENT '时长（月）',
    `original_amount` decimal(10,2) NOT NULL COMMENT '原价',
    `discount_amount` decimal(10,2) DEFAULT 0.00 COMMENT '优惠金额',
    `final_amount` decimal(10,2) NOT NULL COMMENT '实付金额',
    `payment_method` varchar(20) DEFAULT 'WECHAT_PAY' COMMENT '支付方式',
    `transaction_id` varchar(128) DEFAULT NULL COMMENT '第三方交易ID',
    `status` varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING-待支付，PAID-已支付，CANCELLED-已取消，REFUNDED-已退款',
    `paid_time` datetime DEFAULT NULL COMMENT '支付时间',
    `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='VIP订单表';

-- 用户每日统计表
CREATE TABLE IF NOT EXISTS `user_daily_stats` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `date` date NOT NULL COMMENT '日期',
    `requests_count` int NOT NULL DEFAULT 0 COMMENT '请求次数',
    `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_date` (`user_id`, `date`),
    KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户每日统计表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS `system_config` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `config_key` varchar(100) NOT NULL UNIQUE COMMENT '配置键',
    `config_value` text NOT NULL COMMENT '配置值',
    `description` varchar(255) DEFAULT NULL COMMENT '配置说明',
    `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认配置数据
INSERT INTO `system_config` (`config_key`, `config_value`, `description`) VALUES
('vip.monthly.price', '29.90', 'VIP月卡价格'),
('vip.yearly.price', '299.00', 'VIP年卡价格'),
('premium.monthly.price', '99.90', '尊享会员月卡价格'),
('premium.yearly.price', '999.00', '尊享会员年卡价格'),
('daily.free.limit', '10', '普通用户每日免费次数'),
('vip.daily.limit', '100', 'VIP用户每日次数'),
('premium.daily.limit', '500', '尊享会员每日次数')
ON DUPLICATE KEY UPDATE 
    `config_value` = VALUES(`config_value`),
    `updated_time` = CURRENT_TIMESTAMP;

-- 创建管理员账户表
CREATE TABLE IF NOT EXISTS `admin_user` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL UNIQUE COMMENT '用户名',
    `password` varchar(255) NOT NULL COMMENT '密码（BCrypt加密）',
    `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
    `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
    `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
    `role` varchar(20) NOT NULL DEFAULT 'ADMIN' COMMENT '角色：SUPER_ADMIN-超级管理员，ADMIN-管理员',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
    `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员用户表';

-- 插入默认管理员账户 (用户名: admin, 密码: admin123)
-- 注意：生产环境请修改默认密码
INSERT INTO `admin_user` (`username`, `password`, `real_name`, `role`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBaYNS8tMdnuRS', '系统管理员', 'SUPER_ADMIN')
ON DUPLICATE KEY UPDATE 
    `updated_time` = CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;