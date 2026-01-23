#!/bin/bash

# 31度情绪追踪器部署脚本

echo "🚀 开始部署 31度情绪追踪器..."

# 检查环境
echo "📋 检查环境..."
node --version
npm --version

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位于 dist/ 目录"
    
    # 显示构建信息
    echo "📊 构建统计："
    du -sh dist/
    ls -la dist/
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 部署准备完成！"
echo "💡 提示："
echo "1. 将 dist/ 目录内容上传到您的 Web 服务器"
echo "2. 或者推送到 GitHub 并连接 Vercel 自动部署"
echo "3. 配置环境变量 VITE_CLOUDBASE_ENV（如需云同步功能）"