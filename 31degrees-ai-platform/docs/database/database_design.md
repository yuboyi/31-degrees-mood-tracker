# 31度文创精灵AI绘画平台数据库设计

## 数据库概览

数据库名称：`ai_platform`  
字符集：`utf8mb4`  
排序规则：`utf8mb4_unicode_ci`

## 表结构设计

### 1. 用户表 (users)

```sql
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` varchar(64) NOT NULL COMMENT '微信openid',
  `unionid` varchar(64) DEFAULT NULL COMMENT '微信unionid',
  `nickname` varchar(50) DEFAULT NULL COMMENT '用户昵称',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT '头像URL',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `gender` tinyint DEFAULT '0' COMMENT '性别：0未知，1男，2女',
  `city` varchar(50) DEFAULT NULL COMMENT '城市',
  `province` varchar(50) DEFAULT NULL COMMENT '省份',
  `country` varchar(50) DEFAULT NULL COMMENT '国家',
  `language` varchar(20) DEFAULT 'zh_CN' COMMENT '语言',
  `status` tinyint DEFAULT '1' COMMENT '用户状态：0禁用，1正常',
  `vip_level` tinyint DEFAULT '0' COMMENT 'VIP等级：0普通，1白银，2黄金，3钻石',
  `vip_expire_time` datetime DEFAULT NULL COMMENT 'VIP过期时间',
  `total_requests` int DEFAULT '0' COMMENT '总请求次数',
  `daily_requests` int DEFAULT '0' COMMENT '今日请求次数',
  `last_request_date` date DEFAULT NULL COMMENT '最后请求日期',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_unionid` (`unionid`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### 2. AI任务表 (ai_tasks)

```sql
CREATE TABLE `ai_tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `task_type` varchar(20) NOT NULL COMMENT '任务类型：text_to_image, image_to_image, image_to_3d',
  `prompt` text COMMENT '文本描述',
  `negative_prompt` text COMMENT '反向提示词',
  `style` varchar(50) DEFAULT NULL COMMENT '图片风格：写实、动漫、国风等',
  `width` int DEFAULT '512' COMMENT '图片宽度',
  `height` int DEFAULT '512' COMMENT '图片高度',
  `source_image_url` varchar(500) DEFAULT NULL COMMENT '原图URL（图生图使用）',
  `result_image_url` varchar(500) DEFAULT NULL COMMENT '生成结果图片URL',
  `result_3d_url` varchar(500) DEFAULT NULL COMMENT '3D模型结果URL',
  `ai_provider` varchar(20) DEFAULT 'baidu' COMMENT 'AI服务提供商：baidu, aliyun',
  `ai_model` varchar(50) DEFAULT NULL COMMENT 'AI模型名称',
  `status` varchar(20) DEFAULT 'pending' COMMENT '任务状态：pending, processing, completed, failed',
  `error_message` text COMMENT '错误信息',
  `processing_time` int DEFAULT NULL COMMENT '处理耗时（秒）',
  `cost_points` int DEFAULT '0' COMMENT '消耗积分',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_task_type` (`task_type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_time` (`created_time`),
  CONSTRAINT `fk_ai_tasks_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI任务表';
```

### 3. 订单表 (orders)

```sql
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `ai_task_id` bigint DEFAULT NULL COMMENT 'AI任务ID',
  `product_type` varchar(20) NOT NULL COMMENT '产品类型：digital, physical',
  `product_name` varchar(100) NOT NULL COMMENT '产品名称',
  `product_spec` json DEFAULT NULL COMMENT '产品规格（JSON格式）',
  `image_url` varchar(500) NOT NULL COMMENT '产品图片URL',
  `quantity` int DEFAULT '1' COMMENT '数量',
  `unit_price` decimal(10,2) NOT NULL COMMENT '单价（分）',
  `total_amount` decimal(10,2) NOT NULL COMMENT '总金额（分）',
  `shipping_fee` decimal(10,2) DEFAULT '0.00' COMMENT '运费（分）',
  `discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT '优惠金额（分）',
  `final_amount` decimal(10,2) NOT NULL COMMENT '实付金额（分）',
  `status` varchar(20) DEFAULT 'unpaid' COMMENT '订单状态：unpaid, paid, processing, shipped, completed, cancelled',
  `payment_method` varchar(20) DEFAULT NULL COMMENT '支付方式：wechat_pay',
  `payment_time` datetime DEFAULT NULL COMMENT '支付时间',
  `shipping_address` json DEFAULT NULL COMMENT '收货地址（JSON格式）',
  `shipping_time` datetime DEFAULT NULL COMMENT '发货时间',
  `tracking_number` varchar(50) DEFAULT NULL COMMENT '物流单号',
  `completed_time` datetime DEFAULT NULL COMMENT '完成时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_ai_task_id` (`ai_task_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_time` (`created_time`),
  CONSTRAINT `fk_orders_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_ai_task_id` FOREIGN KEY (`ai_task_id`) REFERENCES `ai_tasks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';
```

### 4. 支付记录表 (payments)

```sql
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '支付记录ID',
  `order_id` bigint NOT NULL COMMENT '订单ID',
  `payment_no` varchar(32) NOT NULL COMMENT '支付单号',
  `transaction_id` varchar(64) DEFAULT NULL COMMENT '第三方交易号',
  `payment_method` varchar(20) NOT NULL COMMENT '支付方式：wechat_pay',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额（分）',
  `status` varchar(20) DEFAULT 'pending' COMMENT '支付状态：pending, success, failed, refunded',
  `paid_time` datetime DEFAULT NULL COMMENT '支付完成时间',
  `refund_amount` decimal(10,2) DEFAULT '0.00' COMMENT '退款金额（分）',
  `refund_time` datetime DEFAULT NULL COMMENT '退款时间',
  `callback_data` json DEFAULT NULL COMMENT '回调数据（JSON格式）',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_payments_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';
```

### 5. 产品模板表 (product_templates)

```sql
CREATE TABLE `product_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `name` varchar(100) NOT NULL COMMENT '模板名称',
  `category` varchar(50) NOT NULL COMMENT '分类：crystal, wood, metal',
  `material` varchar(50) NOT NULL COMMENT '材质',
  `size_spec` json NOT NULL COMMENT '尺寸规格（JSON格式）',
  `price` decimal(10,2) NOT NULL COMMENT '价格（分）',
  `preview_image` varchar(500) NOT NULL COMMENT '预览图URL',
  `description` text COMMENT '描述',
  `is_active` tinyint DEFAULT '1' COMMENT '是否启用：0否，1是',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品模板表';
```

### 6. 系统配置表 (system_configs)

```sql
CREATE TABLE `system_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text NOT NULL COMMENT '配置值',
  `config_type` varchar(20) DEFAULT 'string' COMMENT '配置类型：string, number, json, boolean',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `is_system` tinyint DEFAULT '0' COMMENT '是否系统配置：0否，1是',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';
```

### 7. 管理员表 (admins)

```sql
CREATE TABLE `admins` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码（加密）',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `role` varchar(20) DEFAULT 'admin' COMMENT '角色：super_admin, admin, operator',
  `status` tinyint DEFAULT '1' COMMENT '状态：0禁用，1正常',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';
```

## 索引设计

### 主要索引
1. 主键索引：所有表的 `id` 字段
2. 唯一索引：`openid`, `order_no`, `payment_no`, `config_key`, `username`
3. 普通索引：`user_id`, `status`, `created_time` 等高频查询字段

### 复合索引
1. `ai_tasks` 表：`(user_id, status, created_time)`
2. `orders` 表：`(user_id, status, created_time)`
3. `payments` 表：`(order_id, status)`

## 数据初始化

### 系统配置初始化
```sql
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_type`, `description`, `is_system`) VALUES
('daily_request_limit', '100', 'number', '用户每日请求限制', 1),
('vip_daily_request_limit', '500', 'number', 'VIP用户每日请求限制', 1),
('text_to_image_points', '10', 'number', '文生图消耗积分', 1),
('image_to_image_points', '15', 'number', '图生图消耗积分', 1),
('image_to_3d_points', '50', 'number', '图转3D消耗积分', 1),
('default_image_style', '写实', 'string', '默认图片风格', 1);
```

### 产品模板初始化
```sql
INSERT INTO `product_templates` (`name`, `category`, `material`, `size_spec`, `price`, `preview_image`, `description`) VALUES
('水晶内雕小号', 'crystal', '光学水晶', '{"width": 60, "height": 60, "depth": 20, "unit": "mm"}', 19900, '/images/templates/crystal_small.jpg', '精美水晶内雕，适合个人纪念'),
('水晶内雕中号', 'crystal', '光学水晶', '{"width": 80, "height": 80, "depth": 30, "unit": "mm"}', 29900, '/images/templates/crystal_medium.jpg', '经典水晶内雕，送礼首选'),
('木质激光雕刻', 'wood', '进口榉木', '{"width": 100, "height": 100, "depth": 10, "unit": "mm"}', 15900, '/images/templates/wood_carving.jpg', '天然木质雕刻，环保材质');
```

## 备注说明

1. 所有金额单位均为分，避免浮点数精度问题
2. 使用 JSON 字段存储复杂结构数据（地址、规格等）
3. 创建时间和更新时间自动维护
4. 外键约束确保数据完整性
5. 合理设置索引提升查询性能
6. 支持软删除（通过状态字段）
7. 预留扩展字段便于后续功能迭代