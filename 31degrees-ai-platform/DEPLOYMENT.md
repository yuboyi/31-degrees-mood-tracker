# 31度文创精灵AI平台部署指南

## 概述
本项目采用Docker容器化部署，包含以下服务：
- **MySQL 8.0**: 数据库服务
- **Redis 7.0**: 缓存服务  
- **Backend API**: Spring Boot后端服务
- **Admin Backend**: 管理后台服务
- **Nginx**: 反向代理和负载均衡

## 环境要求

### 服务器配置
- **CPU**: 2核心以上
- **内存**: 4GB以上
- **存储**: 50GB以上SSD
- **网络**: 公网IP，带宽10Mbps以上

### 软件环境
- **操作系统**: Linux (推荐Ubuntu 20.04+) 或 Windows Server 2019+
- **Docker**: 20.10+
- **Docker Compose**: 1.29+
- **域名**: 需要2个子域名（api.yourdomain.com, admin.yourdomain.com）

## 部署步骤

### 1. 服务器准备

#### Linux环境
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker
```

#### Windows环境
1. 安装 Docker Desktop for Windows
2. 启用WSL2后端
3. 确保Docker和Docker Compose正常运行

### 2. 项目部署

```bash
# 克隆项目到服务器
git clone <项目仓库地址>
cd 31degrees-ai-platform

# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

### 3. 配置说明

编辑 `.env` 文件，配置以下参数：

```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_user_password

# 阿里云OSS配置
ALIYUN_OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_BUCKET_NAME=your_bucket_name

# 百度AI配置
BAIDU_AI_API_KEY=your_baidu_api_key
BAIDU_AI_SECRET_KEY=your_baidu_secret_key

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 微信支付配置
WECHAT_PAY_MCH_ID=your_merchant_id
WECHAT_PAY_PRIVATE_KEY_PATH=/app/cert/apiclient_key.pem
WECHAT_PAY_MERCHANT_SERIAL_NUMBER=your_merchant_serial_number
WECHAT_PAY_API_V3_KEY=your_api_v3_key
```

### 4. SSL证书配置

将SSL证书文件放置到对应目录：

```bash
# API域名证书
deployment/ssl/api.yourdomain.com.pem
deployment/ssl/api.yourdomain.com.key

# 管理后台域名证书
deployment/ssl/admin.yourdomain.com.pem  
deployment/ssl/admin.yourdomain.com.key
```

### 5. 微信支付证书

将微信支付证书放置到：
```bash
deployment/wechat-pay-cert/apiclient_key.pem
deployment/wechat-pay-cert/apiclient_cert.pem
```

### 6. 启动服务

#### Linux
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 启动服务
./deploy.sh start
```

#### Windows
```cmd
# 启动服务
deploy.bat start
```

### 7. 验证部署

服务启动后，检查以下内容：

```bash
# 检查服务状态
./deploy.sh status

# 查看服务日志
./deploy.sh logs

# 测试API接口
curl http://localhost:8080/actuator/health
curl http://localhost:8081/actuator/health
```

## 域名配置

### DNS解析
将域名解析到服务器IP：
```
A    api.yourdomain.com     -> 服务器IP
A    admin.yourdomain.com   -> 服务器IP
```

### 修改Nginx配置
编辑以下文件，替换域名：
- `deployment/nginx/conf.d/api.conf`
- `deployment/nginx/conf.d/admin.conf`

## 运维管理

### 常用命令
```bash
# 启动服务
./deploy.sh start

# 停止服务  
./deploy.sh stop

# 重启服务
./deploy.sh restart

# 查看日志
./deploy.sh logs [服务名]

# 查看状态
./deploy.sh status

# 更新服务
./deploy.sh update

# 备份数据
./deploy.sh backup

# 清理资源
./deploy.sh cleanup
```

### 日志查看
- 应用日志: `logs/backend/`, `logs/admin/`
- Nginx日志: `logs/nginx/`
- Docker日志: `docker logs <容器名>`

### 数据备份
系统会自动创建备份到 `backups/` 目录，包含：
- 数据库备份文件
- 应用日志文件

### 监控告警
访问以下端点进行健康检查：
- API健康检查: `https://api.yourdomain.com/api/health`
- 管理后台健康检查: `https://admin.yourdomain.com/actuator/health`

## 安全建议

1. **修改默认密码**: 数据库密码、管理员账户密码
2. **防火墙配置**: 只开放必要端口 (80, 443)
3. **定期备份**: 数据库和重要文件
4. **SSL证书**: 使用有效的SSL证书
5. **访问限制**: 管理后台IP白名单
6. **日志监控**: 定期查看异常日志

## 故障排查

### 常见问题

1. **服务无法启动**
   - 检查端口占用: `netstat -tlnp | grep :8080`
   - 查看容器日志: `docker logs ai-platform-backend`
   - 检查配置文件: 验证.env配置是否正确

2. **数据库连接失败**  
   - 检查MySQL容器状态
   - 验证数据库密码配置
   - 查看数据库日志

3. **API接口异常**
   - 检查后端服务日志
   - 验证第三方API配置
   - 检查网络连接

4. **文件上传失败**
   - 检查OSS配置
   - 验证存储空间权限
   - 查看文件大小限制

### 联系支持
如遇到部署问题，请提供：
- 服务器配置信息
- 错误日志内容  
- 具体操作步骤

---

## 更新历史
- v1.0.0: 初始版本部署配置