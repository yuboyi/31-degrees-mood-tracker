# 31度情绪追踪器 (31 Degrees Mood Tracker)

一个现代化的情绪追踪和分析应用，帮助用户记录、分析和管理日常情绪状态。

![31度情绪追踪器](https://img.shields.io/badge/31度情绪追踪器-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-blue)
![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF)

## ✨ 功能特性

- 📊 **情绪记录**: 简单直观的5分制情绪打分系统
- 📈 **数据可视化**: 情绪趋势图表和统计分析
- 📝 **情绪日记**: 记录每日情绪和相关事件
- ☁️ **云端同步**: 基于腾讯云开发的数据同步功能
- 📱 **响应式设计**: 完美适配手机、平板和桌面设备
- 🎯 **智能分析**: 自动生成情绪趋势和个性化建议
- 🔄 **离线支持**: 本地数据存储，无网络时也能使用
- 🎨 **现代UI**: 使用 Tailwind CSS 打造的美观界面

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **状态管理**: Zustand + 本地持久化
- **图标库**: Lucide React
- **云服务**: 腾讯云开发 (Cloudbase)
- **日期处理**: date-fns
- **部署平台**: Vercel

## 🚀 快速开始

### 环境要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/31-degrees-mood-tracker.git
   cd 31-degrees-mood-tracker
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**（可选，用于云同步功能）
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加您的腾讯云开发环境ID
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **打开浏览器**
   访问 `http://localhost:3000` 开始使用

### 构建生产版本

```bash
npm run build
npm run preview
```

## 📱 使用指南

### 基础功能

1. **记录心情**
   - 点击"记录心情"按钮
   - 选择1-5分的心情评分
   - 可选择性添加文字备注
   - 每天可以更新心情记录

2. **查看历史**
   - 在历史记录页面查看过往记录
   - 支持按月份和心情类型筛选
   - 查看详细的心情变化时间线

3. **统计分析**
   - 查看心情平均分和分布
   - 分析近期心情趋势
   - 获得个性化的心情建议

### 云同步功能（可选）

如果配置了腾讯云开发环境：

1. **登录**
   - 在设置页面点击"匿名登录"
   - 系统会自动创建云端账户

2. **数据同步**
   - 点击"同步到云端"上传本地数据
   - 点击"从云端加载"下载云端数据
   - 支持多设备间数据同步

3. **数据备份**
   - 创建数据备份防止丢失
   - 备份文件保存在云端

## 🔧 配置说明

### 环境变量

创建 `.env` 文件并添加以下配置：

```env
# 腾讯云开发环境ID（可选）
VITE_CLOUDBASE_ENV=your-env-id

# 腾讯云开发地域（可选，默认为 ap-shanghai）
VITE_CLOUDBASE_REGION=ap-shanghai
```

### 腾讯云开发配置

1. 访问 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 创建新的云开发环境
3. 复制环境ID到 `.env` 文件
4. 在云开发控制台启用以下服务：
   - 云数据库
   - 匿名登录

## 📂 项目结构

```
31-degrees-mood-tracker/
├── src/
│   ├── components/         # 可复用组件
│   │   └── Layout.tsx     # 主布局组件
│   ├── pages/             # 页面组件
│   │   ├── HomePage.tsx   # 首页
│   │   ├── AddMoodPage.tsx # 添加心情页面
│   │   ├── HistoryPage.tsx # 历史记录页面
│   │   ├── StatsPage.tsx  # 统计分析页面
│   │   └── SettingsPage.tsx # 设置页面
│   ├── store/             # 状态管理
│   │   └── moodStore.ts   # Zustand store
│   ├── services/          # 服务层
│   │   └── cloudService.ts # 云服务
│   ├── lib/               # 第三方库配置
│   │   └── cloudbase.ts   # Cloudbase 配置
│   ├── types/             # TypeScript 类型
│   │   └── index.ts       # 类型定义
│   ├── utils/             # 工具函数
│   │   └── index.ts       # 通用工具
│   ├── App.tsx            # 根组件
│   ├── main.tsx          # 应用入口
│   └── index.css         # 全局样式
├── public/               # 静态资源
├── dist/                # 构建输出目录
├── .env.example         # 环境变量模板
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
├── tailwind.config.js   # Tailwind 配置
├── vite.config.ts       # Vite 配置
└── vercel.json          # Vercel 部署配置
```

## 🎨 界面预览

应用包含以下核心页面：

- **首页**: 显示今日心情状态和快速统计
- **记录心情**: 5分制心情选择界面
- **历史记录**: 时间线式的心情记录展示
- **统计分析**: 图表化的数据分析和趋势展示
- **设置**: 云同步和账户管理功能

## 🚀 部署指南

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 连接 GitHub 到 Vercel
3. 选择项目并部署
4. 在 Vercel 环境变量中配置 `VITE_CLOUDBASE_ENV`

### 自托管部署

```bash
npm run build
# 将 dist/ 目录内容部署到您的 Web 服务器
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 开发计划

- [x] 核心情绪记录功能
- [x] 本地数据存储
- [x] 历史记录查看
- [x] 统计分析功能
- [x] 响应式设计
- [x] 云端数据同步
- [ ] 推送通知提醒
- [ ] 数据导出功能
- [ ] 多语言支持
- [ ] 深色模式
- [ ] PWA 支持

## 📄 许可证

本项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [Lucide React](https://lucide.dev/) - 图标库
- [腾讯云开发](https://cloud.tencent.com/product/tcb) - 云服务提供商

---

**31度情绪追踪器** - 用科技记录生活，用数据理解自己 💙