#!/bin/bash

# 31度文创精灵AI平台部署脚本
# 使用方法：./deploy.sh [start|stop|restart|logs|status]

set -e

# 配置变量
PROJECT_NAME="31degrees-ai-platform"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印彩色信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
check_requirements() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 检查环境配置文件
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "环境配置文件 $ENV_FILE 不存在"
        if [ -f ".env.example" ]; then
            print_info "复制 .env.example 为 $ENV_FILE"
            cp .env.example $ENV_FILE
            print_warning "请编辑 $ENV_FILE 文件配置相关参数"
            exit 1
        else
            print_error "请创建 $ENV_FILE 环境配置文件"
            exit 1
        fi
    fi
}

# 启动服务
start_services() {
    print_info "启动 $PROJECT_NAME 服务..."
    
    # 检查必要条件
    check_requirements
    check_env
    
    # 创建网络（如果不存在）
    docker network create ai-platform-network 2>/dev/null || true
    
    # 启动服务
    docker-compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d
    
    # 等待服务启动
    print_info "等待服务启动完成..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 停止服务
stop_services() {
    print_info "停止 $PROJECT_NAME 服务..."
    docker-compose -f $COMPOSE_FILE down
    print_info "服务已停止"
}

# 重启服务
restart_services() {
    print_info "重启 $PROJECT_NAME 服务..."
    stop_services
    start_services
}

# 查看日志
view_logs() {
    service=$1
    if [ -z "$service" ]; then
        print_info "显示所有服务日志..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100
    else
        print_info "显示 $service 服务日志..."
        docker-compose -f $COMPOSE_FILE logs -f --tail=100 $service
    fi
}

# 检查服务健康状态
check_services_health() {
    print_info "检查服务健康状态..."
    
    services=("mysql" "redis" "backend" "admin" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose -f $COMPOSE_FILE ps $service | grep -q "Up"; then
            print_info "$service: 运行中 ✓"
        else
            print_error "$service: 停止 ✗"
        fi
    done
    
    # 检查HTTP服务
    print_info "检查HTTP服务..."
    
    if curl -f http://localhost:8080/actuator/health &>/dev/null; then
        print_info "后端API: 健康 ✓"
    else
        print_warning "后端API: 不健康 ⚠"
    fi
    
    if curl -f http://localhost:8081/actuator/health &>/dev/null; then
        print_info "管理后台: 健康 ✓"
    else
        print_warning "管理后台: 不健康 ⚠"
    fi
}

# 显示服务状态
show_status() {
    print_info "服务状态："
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    check_services_health
}

# 更新服务
update_services() {
    print_info "更新 $PROJECT_NAME 服务..."
    
    # 拉取最新镜像
    docker-compose -f $COMPOSE_FILE pull
    
    # 重新构建本地镜像
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # 重启服务
    restart_services
}

# 备份数据
backup_data() {
    backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $backup_dir
    
    print_info "备份数据到 $backup_dir"
    
    # 备份数据库
    docker-compose -f $COMPOSE_FILE exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD ai_platform > $backup_dir/database.sql
    
    # 备份日志
    cp -r ./logs $backup_dir/
    
    print_info "备份完成"
}

# 清理资源
cleanup() {
    print_info "清理未使用的Docker资源..."
    docker system prune -f
    docker volume prune -f
    print_info "清理完成"
}

# 主函数
main() {
    case "$1" in
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            view_logs $2
            ;;
        "status")
            show_status
            ;;
        "update")
            update_services
            ;;
        "backup")
            backup_data
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "使用方法: $0 {start|stop|restart|logs|status|update|backup|cleanup}"
            echo ""
            echo "命令说明:"
            echo "  start   - 启动所有服务"
            echo "  stop    - 停止所有服务"
            echo "  restart - 重启所有服务"
            echo "  logs    - 查看服务日志 (可指定服务名)"
            echo "  status  - 显示服务状态"
            echo "  update  - 更新服务"
            echo "  backup  - 备份数据"
            echo "  cleanup - 清理Docker资源"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"