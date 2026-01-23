# 31度文创精灵 AI平台

> 基于AI技术的创意图像生成平台，提供文生图、图生图、图转2.5D/3D等功能

## 项目介绍

31度文创精灵是一个完整的AI绘画平台，包含微信小程序前端、Spring Boot后端API和管理后台系统。平台集成了百度文心一格AI绘画API，为用户提供多样化的AI创作功能。

### 核心功能

- 🎨 **文生图**: 根据文字描述生成精美图片
- 🖼️ **图生图**: 基于现有图片进行AI重新创作  
- 🎯 **图转2.5D**: 将平面图片转换为立体2.5D效果
- 🔮 **图转3D**: 生成完整的3D立体模型效果
- 💎 **VIP会员**: 多层级会员体系，提供更多创作次数
- 💰 **微信支付**: 完整的支付流程和订单管理
- 📱 **微信小程序**: 原生小程序体验
- 🛠️ **管理后台**: 用户管理、订单管理、数据统计

## 技术架构

### 后端技术栈
- **Spring Boot 3.2.0**: 主框架
- **Spring Security**: 安全认证
- **Spring Data JPA**: 数据持久层
- **MySQL 8.0**: 关系型数据库
- **Redis 7.0**: 缓存中间件
- **JWT**: 无状态认证
- **阿里云OSS**: 对象存储
- **百度AI API**: AI绘画能力
- **微信SDK**: 小程序登录和支付
- **Docker**: 容器化部署

### 前端技术栈
- **微信小程序**: 原生开发
- **Thymeleaf**: 管理后台模板引擎
- **Bootstrap 5**: 前端UI框架
- **JavaScript**: 交互逻辑

## 项目结构

```
31degrees-ai-platform/
├── backend/                    # Spring Boot后端API
│   ├── src/main/java/         # Java源码
│   ├── src/main/resources/    # 配置文件
│   └── pom.xml               # Maven配置
├── admin-backend/             # 管理后台
│   ├── src/main/java/        # Java源码  
│   ├── src/main/resources/   # 配置文件和模板
│   └── pom.xml              # Maven配置
├── miniprogram-frontend/      # 微信小程序前端
│   ├── pages/               # 页面文件
│   ├── components/          # 组件文件
│   ├── utils/              # 工具类
│   └── app.js              # 应用入口
├── deployment/              # 部署配置
│   ├── nginx/              # Nginx配置
│   ├── ssl/               # SSL证书
│   └── init.sql           # 数据库初始化
├── docker-compose.yml      # Docker编排
├── deploy.sh              # Linux部署脚本
├── deploy.bat             # Windows部署脚本
└── README.md              # 项目说明
```

## 快速开始

### 环境要求
- Java 17+
- MySQL 8.0+
- Redis 7.0+
- Node.js 16+ (开发环境)
- Docker & Docker Compose (生产环境)

### 本地开发

1. **克隆项目**
```bash
git clone <项目地址>
cd 31degrees-ai-platform
```

2. **数据库配置**
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE ai_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入初始化数据
mysql -u root -p ai_platform < deployment/init.sql
```

3. **后端服务启动**
```bash
cd backend
mvn spring-boot:run
```

4. **管理后台启动**  
```bash
cd admin-backend
mvn spring-boot:run
```

5. **小程序开发**
- 使用微信开发者工具打开 `miniprogram-frontend` 目录
- 配置小程序AppID
- 启动预览调试

### 生产部署

详细部署步骤请参考: [部署指南](DEPLOYMENT.md)

```bash
# 配置环境变量
cp .env.example .env
nano .env

# 启动服务
./deploy.sh start
```

## API文档

### 认证接口
```
POST /auth/login          # 微信登录
POST /auth/refresh        # 刷新Token
```

### AI功能接口
```  
POST /ai/text-to-image    # 文生图
POST /ai/image-to-image   # 图生图
POST /ai/image-to-25d     # 图转2.5D
POST /ai/image-to-3d      # 图转3D
GET  /ai/tasks           # 任务列表
GET  /ai/tasks/{id}      # 任务详情
GET  /ai/stats           # 用户统计
```

### 支付接口
```
POST /payment/vip/create  # 创建VIP订单
POST /payment/wechat/notify # 微信支付回调
GET  /orders             # 订单列表
```

## 配置说明

### 核心配置项

```yaml
# 数据库配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ai_platform
    username: root
    password: your_password

# Redis配置
  redis:
    host: localhost
    port: 6379

# 阿里云OSS
aliyun:
  oss:
    endpoint: https://oss-cn-hangzhou.aliyuncs.com
    accessKeyId: your_access_key
    accessKeySecret: your_access_secret
    bucketName: your_bucket

# 百度AI配置
baidu:
  ai:
    apiKey: your_api_key
    secretKey: your_secret_key

# 微信配置
wechat:
  miniprogram:
    appid: your_appid  
    secret: your_secret
  pay:
    mchId: your_mch_id
    apiV3Key: your_api_v3_key
```

## 开发指南

### 后端开发
1. 遵循RESTful API设计规范
2. 使用统一的响应格式 `ApiResponse<T>`
3. 异常处理通过 `@ControllerAdvice` 统一处理
4. 数据验证使用 `@Valid` 注解
5. 日志记录使用 `@Slf4j` 注解

### 小程序开发
1. 页面结构：`pages/模块/功能/`
2. 公共组件：`components/`
3. 工具类：`utils/`
4. API调用统一封装在 `utils/api.js`
5. 认证逻辑封装在 `utils/auth.js`

### 数据库设计
- 用户表：`user` 
- AI任务表：`ai_task`
- VIP订单表：`vip_order`
- 每日统计表：`user_daily_stats`
- 系统配置表：`system_config`
- 管理员表：`admin_user`

## 测试

### 单元测试
```bash
# 后端测试
cd backend
mvn test

# 管理后台测试  
cd admin-backend
mvn test
```

### 接口测试
```bash
# 健康检查
curl http://localhost:8080/actuator/health

# 登录接口测试
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"微信登录code"}'
```

## 部署架构

```
Internet
    │
    ▼
┌─────────┐
│  Nginx  │ (反向代理 + SSL)
└─────────┘
    │
    ├─── Backend API (8080)
    └─── Admin Backend (8081)
         │
         ▼
    ┌─────────┐
    │  MySQL  │ (数据存储)
    └─────────┘
         │
    ┌─────────┐  
    │  Redis  │ (缓存)
    └─────────┘
```

## 监控运维

### 健康检查
- API: `https://api.yourdomain.com/actuator/health`
- Admin: `https://admin.yourdomain.com/actuator/health`

### 日志管理
- 应用日志: `logs/backend/`, `logs/admin/`
- 访问日志: `logs/nginx/access.log`  
- 错误日志: `logs/nginx/error.log`

### 备份策略
- 数据库: 每日自动备份
- 日志文件: 轮转保留30天
- 配置文件: 版本控制管理

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 联系方式

- 项目地址: https://github.com/yourusername/31degrees-ai-platform
- 问题反馈: https://github.com/yourusername/31degrees-ai-platform/issues
- 邮箱: support@31degrees.cn

---

## 更新日志

### v1.0.0 (2025-01-XX)
- 🎉 项目初始发布
- ✨ 完整的AI绘画功能
- 💎 VIP会员体系
- 💰 微信支付集成
- 📱 微信小程序前端
- 🛠️ 管理后台系统
- 🐳 Docker容器化部署

---

<div align="center">

**[⬆ 回到顶部](#31度文创精灵-ai平台)**

Made with ❤️ by 31度文创精灵团队

</div>