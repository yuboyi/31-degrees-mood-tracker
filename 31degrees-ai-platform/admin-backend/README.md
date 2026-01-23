# 31度文创精灵管理后台

## 项目简介

31度文创精灵管理后台是一个基于Spring Boot + Thymeleaf开发的Web管理系统，用于管理AI绘画平台的用户、订单、任务等业务数据。

## 技术栈

- **后端框架**: Spring Boot 3.2.0
- **模板引擎**: Thymeleaf
- **安全框架**: Spring Security
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.0
- **连接池**: Druid
- **ORM框架**: MyBatis Plus
- **前端框架**: Bootstrap 5 + Font Awesome
- **构建工具**: Maven 3.8+
- **JDK版本**: JDK 17+

## 主要功能

### 🔐 权限管理
- 管理员账户管理
- 角色权限分配
- 菜单权限控制
- 操作日志记录

### 👥 用户管理
- 小程序用户管理
- 用户状态管理
- VIP用户管理
- 用户数据统计

### 🎨 AI任务管理
- AI绘画任务监控
- 任务状态管理
- 任务结果查看
- 失败任务重试

### 💰 订单管理
- VIP订单管理
- 支付状态监控
- 退款处理
- 收入统计

### 📊 数据统计
- 用户增长统计
- 任务量统计
- 收入统计
- 系统性能监控

### ⚙️ 系统设置
- 系统参数配置
- AI接口配置
- 支付配置管理
- 系统维护

## 项目结构

```
admin-backend/
├── src/main/java/com/degrees31/admin/
│   ├── config/              # 配置类
│   ├── controller/          # 控制器
│   ├── entity/             # 实体类
│   ├── mapper/             # 数据访问层
│   ├── service/            # 业务逻辑层
│   ├── dto/                # 数据传输对象
│   ├── vo/                 # 视图对象
│   └── util/               # 工具类
├── src/main/resources/
│   ├── templates/          # Thymeleaf模板
│   ├── static/             # 静态资源
│   ├── mapper/             # MyBatis XML文件
│   └── application.yml     # 配置文件
├── database/
│   └── admin_init.sql      # 数据库初始化脚本
└── pom.xml                 # Maven配置
```

## 快速开始

### 1. 环境准备

确保您的开发环境满足以下要求：

- JDK 17 或更高版本
- Maven 3.8 或更高版本
- MySQL 8.0 或更高版本
- Redis 7.0 或更高版本

### 2. 数据库配置

1. 创建数据库：
```sql
CREATE DATABASE ai_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 执行初始化脚本：
```bash
mysql -u root -p ai_platform < database/admin_init.sql
```

### 3. 配置文件

修改 `src/main/resources/application.yml` 中的数据库连接配置：

```yaml
spring:
  datasource:
    druid:
      url: jdbc:mysql://localhost:3306/ai_platform?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
      username: your_username
      password: your_password
  data:
    redis:
      host: 127.0.0.1
      port: 6379
      database: 2
```

### 4. 启动应用

```bash
# 编译项目
mvn clean compile

# 启动应用
mvn spring-boot:run
```

应用启动成功后，访问：http://localhost:8081/admin

### 5. 默认账户

- 用户名：`admin`
- 密码：`admin123`

## 主要页面

### 📊 仪表盘
- 系统概览
- 实时数据统计
- 快速操作入口

### 👤 用户管理
- 用户列表查看
- 用户详细信息
- 用户状态管理
- VIP用户管理

### 🎨 AI任务管理
- 任务列表监控
- 任务详情查看
- 失败任务处理
- 任务统计分析

### 💳 订单管理
- 订单列表查看
- 支付状态管理
- 退款处理
- 收入报表

### 🛠 系统管理
- 管理员管理
- 角色权限管理
- 系统参数配置
- 操作日志查看

## 开发规范

### 代码规范
- 遵循Java编码规范
- 使用Lombok减少样板代码
- 统一异常处理
- 接口文档规范

### 数据库规范
- 统一表名和字段命名
- 必要的索引优化
- 数据库字段注释
- 逻辑删除设计

### 前端规范
- Bootstrap组件使用
- 响应式设计
- 用户体验优化
- 浏览器兼容性

## 部署说明

### 1. 生产环境配置

创建生产环境配置文件 `application-prod.yml`：

```yaml
server:
  port: 8081

spring:
  datasource:
    druid:
      url: jdbc:mysql://your-prod-host:3306/ai_platform
      username: ${DB_USERNAME}
      password: ${DB_PASSWORD}
  
  data:
    redis:
      host: ${REDIS_HOST}
      password: ${REDIS_PASSWORD}

logging:
  level:
    root: WARN
    com.degrees31.admin: INFO
  file:
    name: /var/log/admin-backend/application.log
```

### 2. Docker部署

```dockerfile
FROM openjdk:17-jre-slim

WORKDIR /app
COPY target/admin-backend-1.0.0.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
```

### 3. 构建部署包

```bash
# 编译打包
mvn clean package -DskipTests

# 运行应用
java -jar target/admin-backend-1.0.0.jar --spring.profiles.active=prod
```

## 监控和维护

### 数据库监控
- 访问Druid监控：http://localhost:8081/admin/druid
- 用户名：admin
- 密码：123456

### 日志管理
- 应用日志：`logs/admin-backend.log`
- 错误日志：自动轮转
- 操作日志：存储在数据库中

### 性能优化
- 数据库连接池优化
- Redis缓存策略
- 静态资源CDN
- 接口响应优化

## 常见问题

### Q: 忘记管理员密码怎么办？
A: 可以通过以下SQL重置密码（新密码：admin123）：
```sql
UPDATE admin_user SET password = '$2a$10$7JB720yubVSaD6VzwSfXH.qOnnqc.rRXqzeg6DHVNDXZFp9mBJlrW' WHERE username = 'admin';
```

### Q: 如何添加新的管理员？
A: 在系统管理 > 管理员管理中添加，或通过SQL插入：
```sql
INSERT INTO admin_user (username, password, real_name, email, role_id, role_name, status, created_by) 
VALUES ('newadmin', '$2a$10$...', '新管理员', 'new@example.com', 2, '管理员', 1, 'admin');
```

### Q: 数据库连接失败怎么办？
A: 检查以下配置：
1. 数据库服务是否启动
2. 连接参数是否正确
3. 用户权限是否充足
4. 网络连接是否正常

## 更新日志

### v1.0.0 (2025-08-28)
- 初始版本发布
- 基础权限管理
- 用户管理功能
- AI任务管理
- 订单管理
- 数据统计
- 系统设置

## 联系方式

- 项目地址：https://github.com/31degrees/ai-platform
- 技术支持：tech@31degrees.com
- 问题反馈：https://github.com/31degrees/ai-platform/issues

## 许可证

Copyright © 2025 31度团队. All rights reserved.