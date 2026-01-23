@echo off
REM 31度文创精灵AI平台部署脚本 (Windows版本)
REM 使用方法：deploy.bat [start|stop|restart|logs|status]

setlocal enabledelayedexpansion

set PROJECT_NAME=31degrees-ai-platform
set COMPOSE_FILE=docker-compose.yml
set ENV_FILE=.env

REM 检查Docker和Docker Compose
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker 未安装，请先安装 Docker Desktop
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose 未安装，请先安装 Docker Compose
    exit /b 1
)

REM 检查环境配置文件
if not exist "%ENV_FILE%" (
    echo [WARNING] 环境配置文件 %ENV_FILE% 不存在
    if exist ".env.example" (
        echo [INFO] 复制 .env.example 为 %ENV_FILE%
        copy .env.example %ENV_FILE%
        echo [WARNING] 请编辑 %ENV_FILE% 文件配置相关参数
        exit /b 1
    ) else (
        echo [ERROR] 请创建 %ENV_FILE% 环境配置文件
        exit /b 1
    )
)

REM 根据参数执行对应操作
if "%1"=="start" goto start_services
if "%1"=="stop" goto stop_services
if "%1"=="restart" goto restart_services
if "%1"=="logs" goto view_logs
if "%1"=="status" goto show_status
if "%1"=="update" goto update_services
if "%1"=="backup" goto backup_data
if "%1"=="cleanup" goto cleanup

REM 显示帮助信息
echo 使用方法: %0 {start^|stop^|restart^|logs^|status^|update^|backup^|cleanup}
echo.
echo 命令说明:
echo   start   - 启动所有服务
echo   stop    - 停止所有服务
echo   restart - 重启所有服务
echo   logs    - 查看服务日志
echo   status  - 显示服务状态
echo   update  - 更新服务
echo   backup  - 备份数据
echo   cleanup - 清理Docker资源
exit /b 1

:start_services
echo [INFO] 启动 %PROJECT_NAME% 服务...

REM 创建网络（如果不存在）
docker network create ai-platform-network >nul 2>&1

REM 启动服务
docker-compose --env-file %ENV_FILE% -f %COMPOSE_FILE% up -d

REM 等待服务启动
echo [INFO] 等待服务启动完成...
timeout /t 30 /nobreak >nul

REM 检查服务状态
goto check_services_health

:stop_services
echo [INFO] 停止 %PROJECT_NAME% 服务...
docker-compose -f %COMPOSE_FILE% down
echo [INFO] 服务已停止
exit /b 0

:restart_services
echo [INFO] 重启 %PROJECT_NAME% 服务...
call :stop_services
call :start_services
exit /b 0

:view_logs
echo [INFO] 显示服务日志...
docker-compose -f %COMPOSE_FILE% logs -f --tail=100
exit /b 0

:show_status
echo [INFO] 服务状态：
docker-compose -f %COMPOSE_FILE% ps
echo.
goto check_services_health

:update_services
echo [INFO] 更新 %PROJECT_NAME% 服务...

REM 拉取最新镜像
docker-compose -f %COMPOSE_FILE% pull

REM 重新构建本地镜像
docker-compose -f %COMPOSE_FILE% build --no-cache

REM 重启服务
goto restart_services

:backup_data
set backup_dir=.\backups\%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set backup_dir=!backup_dir: =0!
mkdir "%backup_dir%" >nul 2>&1

echo [INFO] 备份数据到 %backup_dir%

REM 备份数据库
docker-compose -f %COMPOSE_FILE% exec -T mysql mysqldump -u root -p%MYSQL_ROOT_PASSWORD% ai_platform > %backup_dir%\database.sql

REM 备份日志
xcopy /E /I .\logs %backup_dir%\logs >nul 2>&1

echo [INFO] 备份完成
exit /b 0

:cleanup
echo [INFO] 清理未使用的Docker资源...
docker system prune -f
docker volume prune -f
echo [INFO] 清理完成
exit /b 0

:check_services_health
echo [INFO] 检查服务健康状态...

REM 检查容器状态
for %%s in (mysql redis backend admin nginx) do (
    docker-compose -f %COMPOSE_FILE% ps %%s | findstr "Up" >nul
    if !errorlevel! equ 0 (
        echo [INFO] %%s: 运行中 ✓
    ) else (
        echo [ERROR] %%s: 停止 ✗
    )
)

REM 检查HTTP服务
echo [INFO] 检查HTTP服务...
curl -f http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 后端API: 健康 ✓
) else (
    echo [WARNING] 后端API: 不健康 ⚠
)

curl -f http://localhost:8081/actuator/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 管理后台: 健康 ✓
) else (
    echo [WARNING] 管理后台: 不健康 ⚠
)

exit /b 0