# 31度文创精灵AI绘画平台 - 后端API服务

## 🎯 项目简介

31度文创精灵后端API服务是一个基于Spring Boot 3.x构建的现代化企业级应用，为微信小程序和管理后台提供强大的后端支持。

## 🚀 技术栈

- **框架**: Spring Boot 3.1.2
- **数据库**: MySQL 8.0 + Redis 7.0
- **安全**: Spring Security + JWT
- **ORM**: Spring Data JPA + Hibernate
- **构建工具**: Maven 3.6+
- **Java版本**: JDK 17

## 📦 核心依赖

- Spring Boot Web Starter - Web MVC框架
- Spring Boot Data JPA - 数据持久层
- Spring Boot Security - 安全框架
- Spring Boot Data Redis - Redis缓存
- MySQL Connector - MySQL数据库驱动
- JWT (jsonwebtoken) - JWT令牌处理
- 阿里云OSS SDK - 对象存储服务
- Apache HttpClient 5 - HTTP客户端
- Hutool - Java工具库
- Lombok - 代码简化

## 📁 项目结构

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/degrees31/aiplatform/
│   │   │   ├── config/          # 配置类
│   │   │   ├── controller/      # 控制器层
│   │   │   ├── dto/            # 数据传输对象
│   │   │   ├── entity/         # 实体类
│   │   │   ├── repository/     # 数据访问层
│   │   │   ├── service/        # 业务逻辑层
│   │   │   ├── util/           # 工具类
│   │   │   └── AiPlatformApplication.java
│   │   └── resources/
│   │       ├── application.yml  # 应用配置
│   │       └── static/         # 静态资源
│   └── test/                   # 测试代码
├── pom.xml                     # Maven配置
└── README.md
```

## 🔧 快速开始

### 环境准备

1. **Java 17** - 确保安装了JDK 17或更高版本
2. **MySQL 8.0** - 安装并创建数据库 `ai_platform`
3. **Redis 7.0** - 安装Redis服务
4. **Maven 3.6+** - 用于项目构建

### 数据库初始化

```sql
CREATE DATABASE ai_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 配置文件

复制并编辑配置文件：

```bash
# 在 src/main/resources/ 目录下创建 application-dev.yml
cp application.yml application-dev.yml
```

编辑配置文件中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ai_platform?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password
```

### 启动应用

```bash
# 使用Maven启动
mvn spring-boot:run

# 或者先编译再启动
mvn clean package -DskipTests
java -jar target/ai-platform-backend-1.0.0.jar
```

### 验证启动

访问健康检查接口：

```bash
curl http://localhost:8080/api/health
```

预期响应：
```json
{
  "status": "UP",
  "service": "31度文创精灵AI绘画平台",
  "version": "1.0.0",
  "timestamp": "2025-08-28T13:05:00",
  "message": "🎨 系统运行正常，准备开始AI创作！"
}
```

## 🔐 环境变量配置

创建 `.env` 文件或设置系统环境变量：

```bash
# 数据库配置
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your-jwt-secret-key

# 微信小程序配置
WECHAT_APP_ID=your-miniprogram-app-id
WECHAT_APP_SECRET=your-miniprogram-app-secret

# AI API配置
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key

# 阿里云OSS配置
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_ACCESS_KEY_ID=your-oss-access-key-id
OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret
OSS_BUCKET_NAME=31degrees-ai-images
```

## 🔍 API接口

### 健康检查

- `GET /api/health` - 系统健康状态
- `GET /api/health/version` - 版本信息

### 即将开发的接口

- `POST /api/auth/login` - 微信小程序登录
- `POST /api/ai/text-to-image` - 文生图
- `POST /api/ai/image-to-image` - 图生图
- `POST /api/ai/image-to-3d` - 图转3D
- `GET /api/user/profile` - 用户信息
- `GET /api/orders` - 订单列表

## 🧪 测试

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=HealthControllerTest
```

## 🔨 构建与打包

```bash
# 开发环境构建
mvn clean compile

# 生产环境打包
mvn clean package -Pprod

# 跳过测试打包
mvn clean package -DskipTests
```

## 📈 监控与日志

应用提供了以下监控端点：

- `/actuator/health` - 健康检查
- `/actuator/info` - 应用信息
- `/actuator/prometheus` - Prometheus指标

日志文件位置：
- 开发环境：控制台输出
- 生产环境：`logs/ai-platform.log`

## 🚀 部署

### Docker部署（推荐）

```bash
# 构建Docker镜像
docker build -t 31degrees-ai-platform:latest .

# 启动容器
docker run -d \
  --name ai-platform \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  31degrees-ai-platform:latest
```

### 传统部署

```bash
# 打包应用
mvn clean package -Pprod -DskipTests

# 上传到服务器并启动
java -jar ai-platform-backend-1.0.0.jar --spring.profiles.active=prod
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 开发规范

- 使用 Google Java Style Guide
- 所有公共方法必须有Javadoc注释
- 单元测试覆盖率不低于80%
- 使用SLF4J进行日志记录
- 遵循RESTful API设计规范

## 📞 技术支持

- 项目地址：https://github.com/31degrees/ai-platform
- 问题反馈：https://github.com/31degrees/ai-platform/issues
- 技术文档：https://docs.31degrees.com/ai-platform

---

🎨 **31度文创精灵团队** - 让AI创作变得简单而美好！