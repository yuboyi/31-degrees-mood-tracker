# 云服务器部署操作指南

本指南将指导您完成31度文创精灵AI平台在云服务器上的完整部署。

## 前置条件

### 1. 云服务器要求
- **配置**: 2核4GB内存，50GB SSD存储（最低配置）
- **操作系统**: Ubuntu 20.04 LTS / CentOS 8+
- **网络**: 公网IP，5Mbps带宽（建议10Mbps+）

### 2. 域名准备
需要准备2个子域名并完成备案：
- `api.yourdomain.com` - API服务域名
- `admin.yourdomain.com` - 管理后台域名

### 3. SSL证书
- 从阿里云/腾讯云/Let's Encrypt申请SSL证书
- 下载Nginx格式证书文件

## 部署步骤

### 第一步：服务器初始化

```bash
# 1. 连接服务器
ssh root@your_server_ip

# 2. 更新系统
apt update && apt upgrade -y

# 3. 安装基础软件
apt install -y curl wget git vim ufw

# 4. 配置防火墙
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable

# 5. 创建项目用户
adduser aiplatform
usermod -aG sudo aiplatform
su - aiplatform
```

### 第二步：安装Docker环境

```bash
# 1. 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. 添加用户到docker组
sudo usermod -aG docker aiplatform

# 3. 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 5. 验证安装
docker --version
docker-compose --version

# 注销重新登录使docker组生效
exit
ssh aiplatform@your_server_ip
```

### 第三步：部署项目代码

```bash
# 1. 克隆项目（根据实际情况选择方式）

# 方式一：从Git仓库克隆
git clone https://github.com/yourusername/31degrees-ai-platform.git
cd 31degrees-ai-platform

# 方式二：上传项目文件
# 使用scp或其他工具将项目文件上传到服务器
# scp -r ./31degrees-ai-platform aiplatform@your_server_ip:~/

# 2. 设置文件权限
chmod +x deploy.sh

# 3. 查看项目结构
ls -la
```

### 第四步：配置环境变量

```bash
# 1. 复制配置模板
cp .env.example .env

# 2. 编辑配置文件
nano .env

# 3. 配置内容示例（根据实际情况修改）
```

**.env 配置示例:**
```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=YourSecureRootPassword123!
MYSQL_PASSWORD=YourSecureMysqlPassword123!

# 阿里云OSS配置
ALIYUN_OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
ALIYUN_OSS_ACCESS_KEY_ID=LTAI5t***************
ALIYUN_OSS_ACCESS_KEY_SECRET=****************
ALIYUN_OSS_BUCKET_NAME=your-bucket-name

# 百度AI配置
BAIDU_AI_API_KEY=your_baidu_api_key
BAIDU_AI_SECRET_KEY=your_baidu_secret_key

# 微信小程序配置
WECHAT_APPID=wx****************
WECHAT_SECRET=********************************

# 微信支付配置
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_PRIVATE_KEY_PATH=/app/cert/apiclient_key.pem
WECHAT_PAY_MERCHANT_SERIAL_NUMBER=****************
WECHAT_PAY_API_V3_KEY=********************************
```

### 第五步：配置SSL证书

```bash
# 1. 上传证书文件到服务器
# 假设证书文件已上传到 ~/certificates/

# 2. 复制证书到项目目录
cp ~/certificates/api.yourdomain.com.pem deployment/ssl/
cp ~/certificates/api.yourdomain.com.key deployment/ssl/
cp ~/certificates/admin.yourdomain.com.pem deployment/ssl/
cp ~/certificates/admin.yourdomain.com.key deployment/ssl/

# 3. 设置证书权限
chmod 644 deployment/ssl/*.pem
chmod 600 deployment/ssl/*.key
```

### 第六步：配置微信支付证书

```bash
# 1. 上传微信支付证书
# 将从微信商户平台下载的证书文件上传到服务器

# 2. 复制到指定目录
cp ~/wechat-pay-cert/apiclient_key.pem deployment/wechat-pay-cert/
cp ~/wechat-pay-cert/apiclient_cert.pem deployment/wechat-pay-cert/

# 3. 设置权限
chmod 600 deployment/wechat-pay-cert/*
```

### 第七步：修改Nginx配置

```bash
# 1. 编辑API服务配置
nano deployment/nginx/conf.d/api.conf

# 修改域名（将api.31degrees.cn替换为您的实际域名）
:%s/api.31degrees.cn/api.yourdomain.com/g

# 2. 编辑管理后台配置  
nano deployment/nginx/conf.d/admin.conf

# 修改域名（将admin.31degrees.cn替换为您的实际域名）
:%s/admin.31degrees.cn/admin.yourdomain.com/g
```

### 第八步：配置DNS解析

在您的域名管理控制台添加以下DNS记录：

```
类型    主机记录                  记录值
A      api.yourdomain.com       your_server_ip
A      admin.yourdomain.com     your_server_ip
```

### 第九步：启动服务

```bash
# 1. 检查配置
cat .env | head -20

# 2. 启动服务
./deploy.sh start

# 3. 查看启动日志
./deploy.sh logs

# 4. 检查服务状态
./deploy.sh status
```

**预期输出:**
```
[INFO] 启动 31degrees-ai-platform 服务...
[INFO] 等待服务启动完成...
[INFO] 检查服务健康状态...
[INFO] mysql: 运行中 ✓
[INFO] redis: 运行中 ✓
[INFO] backend: 运行中 ✓
[INFO] admin: 运行中 ✓
[INFO] nginx: 运行中 ✓
[INFO] 后端API: 健康 ✓
[INFO] 管理后台: 健康 ✓
```

### 第十步：验证部署

```bash
# 1. 本地健康检查
curl -I http://localhost:8080/actuator/health
curl -I http://localhost:8081/actuator/health

# 2. 域名访问测试
curl -I https://api.yourdomain.com/api/health
curl -I https://admin.yourdomain.com/

# 3. 查看服务日志
./deploy.sh logs backend
./deploy.sh logs admin
./deploy.sh logs nginx
```

## 部署后配置

### 1. 管理后台登录

访问 `https://admin.yourdomain.com`
- 默认用户名: `admin`
- 默认密码: `admin123`
- **重要**: 首次登录后请立即修改密码

### 2. 小程序配置

在微信小程序管理后台配置：

**服务器域名:**
- request合法域名: `https://api.yourdomain.com`
- uploadFile合法域名: `https://api.yourdomain.com`
- downloadFile合法域名: `https://api.yourdomain.com`

**业务域名:**
- `https://api.yourdomain.com`

### 3. 监控配置

设置服务监控脚本：

```bash
# 创建监控脚本
cat > /home/aiplatform/monitor.sh << 'EOF'
#!/bin/bash
cd /home/aiplatform/31degrees-ai-platform

# 检查服务状态
if ! ./deploy.sh status | grep -q "后端API: 健康"; then
    echo "$(date): Backend API is down, restarting..." >> monitor.log
    ./deploy.sh restart
fi

# 清理日志（保留最近30天）
find ./logs -name "*.log" -mtime +30 -delete
EOF

chmod +x /home/aiplatform/monitor.sh

# 设置定时任务
crontab -e
# 添加以下行：
# */5 * * * * /home/aiplatform/monitor.sh
```

## 常见问题解决

### 1. 服务启动失败

```bash
# 查看详细日志
docker-compose logs mysql
docker-compose logs backend

# 检查端口占用
netstat -tlnp | grep :8080
netstat -tlnp | grep :3306

# 重新启动
./deploy.sh stop
./deploy.sh start
```

### 2. 域名无法访问

```bash
# 检查防火墙
sudo ufw status

# 检查Nginx配置
docker-compose exec nginx nginx -t

# 查看Nginx日志
./deploy.sh logs nginx
```

### 3. 数据库连接错误

```bash
# 检查MySQL容器状态
docker-compose ps mysql

# 进入MySQL容器检查
docker-compose exec mysql mysql -u root -p

# 查看数据库日志
docker-compose logs mysql
```

### 4. SSL证书问题

```bash
# 检查证书文件
ls -la deployment/ssl/

# 验证证书有效性
openssl x509 -in deployment/ssl/api.yourdomain.com.pem -text -noout

# 重新加载Nginx配置
docker-compose exec nginx nginx -s reload
```

## 性能优化

### 1. 数据库优化

```sql
-- 连接数据库
docker-compose exec mysql mysql -u root -p

-- 查看当前配置
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';

-- 根据服务器配置调整MySQL参数
-- 在docker-compose.yml中添加my.cnf配置文件挂载
```

### 2. 应用层优化

```bash
# 调整JVM参数（在docker-compose.yml中）
JAVA_OPTS: "-Xmx1g -Xms512m -XX:+UseG1GC"

# 启用应用监控
# 添加Prometheus/Grafana监控栈
```

### 3. Nginx优化

编辑 `deployment/nginx/nginx.conf`:

```nginx
# 增加worker进程数
worker_processes 2;

# 调整连接数
events {
    worker_connections 2048;
}

# 启用缓存
http {
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 备份策略

### 1. 自动备份脚本

```bash
cat > /home/aiplatform/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/aiplatform/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cd /home/aiplatform/31degrees-ai-platform

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD ai_platform > $BACKUP_DIR/db_$DATE.sql

# 备份应用数据
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz logs/ deployment/ssl/ deployment/wechat-pay-cert/

# 清理7天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed - $DATE" >> $BACKUP_DIR/backup.log
EOF

chmod +x /home/aiplatform/backup.sh

# 设置每日凌晨2点备份
crontab -e
# 添加：0 2 * * * /home/aiplatform/backup.sh
```

### 2. 云存储备份

```bash
# 安装阿里云CLI（可选）
wget https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
tar xzvf aliyun-cli-linux-latest-amd64.tgz
sudo mv aliyun /usr/local/bin/

# 配置阿里云CLI
aliyun configure

# 上传备份到OSS
aliyun oss cp /home/aiplatform/backups/ oss://your-backup-bucket/31degrees-platform/ --recursive
```

## 安全加固

### 1. SSH安全

```bash
sudo nano /etc/ssh/sshd_config

# 修改以下配置
Port 2222                    # 修改SSH端口
PermitRootLogin no          # 禁止root登录
PasswordAuthentication no   # 禁用密码登录（使用密钥）
MaxAuthTries 3             # 限制认证尝试次数

sudo systemctl restart sshd

# 更新防火墙规则
sudo ufw delete allow ssh
sudo ufw allow 2222
```

### 2. 应用安全

```bash
# 修改默认管理员密码
# 登录管理后台修改密码

# 配置IP白名单（可选）
# 编辑deployment/nginx/conf.d/admin.conf
# 添加IP限制配置
```

### 3. 系统安全

```bash
# 安装fail2ban防止暴力破解
sudo apt install fail2ban

# 配置自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## 部署完成检查清单

- [ ] 服务器环境配置完成
- [ ] Docker和Docker Compose安装成功
- [ ] 项目代码部署到位
- [ ] 环境变量配置正确
- [ ] SSL证书配置成功
- [ ] 微信支付证书配置成功
- [ ] DNS解析配置正确
- [ ] 所有服务启动成功
- [ ] API接口访问正常
- [ ] 管理后台访问正常
- [ ] 小程序域名配置完成
- [ ] 监控脚本配置完成
- [ ] 备份策略配置完成
- [ ] 安全加固完成
- [ ] 管理员密码已修改

## 技术支持

如果在部署过程中遇到问题，请：

1. 查看相关日志文件
2. 检查服务器配置是否符合要求
3. 确认网络和域名配置是否正确
4. 联系技术支持团队

---

部署完成后，您的31度文创精灵AI平台就可以正式运行了！