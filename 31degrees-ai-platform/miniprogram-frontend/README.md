> 2026-09-29 源码核对：本目录是原生四页历史版本，不代表本机现用小程序源码或已发布版本。27页的 uni-app / Vue 3 现用源码整合候选版见 [miniprogram-current](../miniprogram-current/README.md)。旧目录保留作历史参考。
# 31度文创精灵微信小程序

## 📱 项目简介

31度文创精灵是一个基于AI绘画技术的微信小程序，为用户提供文生图、图生图、图转2.5D/3D等创意服务。

## 🎯 功能特性

### 🎨 AI创作功能
- **文生图**：输入文字描述，AI生成对应图片
- **图生图**：基于现有图片和文字描述重新创作
- **图转2.5D**：将平面图片转换为2.5D立体效果
- **图转3D**：将图片转换为3D立体模型

### 🎭 风格支持
- 写实风格：真实照片效果
- 动漫风格：日式动漫画风
- 国风风格：中国传统艺术
- 油画风格：欧洲古典油画
- 水彩风格：水彩画效果
- 素描风格：铅笔素描

### 📱 小程序功能
- 微信一键登录
- 作品云端同步
- 创作历史记录
- 个人作品集
- VIP会员体系
- 作品分享功能

## 🏗️ 技术架构

```
小程序前端
├── 页面层 (Pages)
│   ├── 首页 (index)
│   ├── AI创作 (create)
│   ├── 作品集 (gallery)
│   └── 个人中心 (profile)
├── 组件层 (Components)
│   ├── 通用组件
│   └── 业务组件
├── 工具层 (Utils)
│   ├── API请求 (api.js)
│   ├── 用户认证 (auth.js)
│   └── 通用工具 (util.js)
└── 配置层
    ├── 全局配置 (app.json)
    └── 页面配置
```

## 📁 目录结构

```
miniprogram-frontend/
├── pages/                 # 页面目录
│   ├── index/             # 首页
│   ├── create/            # AI创作页
│   ├── gallery/           # 作品集页
│   └── profile/           # 个人中心页
├── components/            # 组件目录
├── utils/                 # 工具类目录
│   ├── api.js            # API请求工具
│   ├── auth.js           # 认证工具
│   └── util.js           # 通用工具
├── images/               # 图片资源目录
├── app.js                # 小程序入口文件
├── app.json              # 全局配置文件
├── app.wxss              # 全局样式文件
├── sitemap.json          # 站点地图配置
├── project.config.json   # 项目配置文件
└── README.md
```

## 🚀 快速开始

### 环境准备

1. **微信开发者工具**
   - 下载并安装最新版本的微信开发者工具
   - 登录微信开发者账号

2. **小程序账号**
   - 注册微信小程序账号
   - 获取小程序AppID

### 项目配置

1. **配置AppID**
   ```json
   // project.config.json
   {
     "appid": "你的小程序AppID"
   }
   ```

2. **配置后端API地址**
   ```javascript
   // utils/api.js
   const API_BASE_URL = 'https://你的后端域名/api'
   ```

### 开发步骤

1. **导入项目**
   - 打开微信开发者工具
   - 导入项目，选择miniprogram-frontend目录
   - 填入小程序AppID

2. **本地开发**
   - 在微信开发者工具中预览
   - 修改代码后实时预览效果
   - 使用开发者工具的调试功能

3. **真机测试**
   - 点击"预览"生成二维码
   - 使用微信扫码在真机上测试

## 🎨 页面说明

### 首页 (index)
- 展示小程序核心功能
- 最新作品推荐
- 快速入口导航
- 用户登录引导

### AI创作页 (create)
- 文生图创作界面
- 图生图上传和编辑
- 风格选择器
- 参数调节面板
- 创作进度显示

### 作品集页 (gallery)
- 个人创作历史
- 作品分类筛选
- 作品预览和管理
- 分享和下载功能

### 个人中心页 (profile)
- 用户信息展示
- VIP状态和权益
- 使用统计数据
- 设置和帮助

## 🛠️ 开发指南

### API调用示例

```javascript
const api = require('../../utils/api.js')

// 文生图API调用
api.post('/ai/text-to-image', {
  prompt: '一只可爱的小猫',
  style: '写实',
  width: 512,
  height: 512
}, {
  success: (res) => {
    console.log('创作成功:', res.data)
    // 处理成功结果
  },
  fail: (err) => {
    console.error('创作失败:', err)
    // 处理错误
  }
})
```

### 用户认证

```javascript
const auth = require('../../utils/auth.js')

// 用户登录
auth.login().then(result => {
  console.log('登录成功:', result)
  // 登录成功处理
}).catch(err => {
  console.error('登录失败:', err)
})

// 检查登录状态
if (auth.checkLogin()) {
  // 已登录状态的处理
} else {
  // 未登录状态的处理
}
```

### 组件开发规范

```javascript
// 组件示例
Component({
  properties: {
    // 组件属性
  },
  data: {
    // 组件数据
  },
  methods: {
    // 组件方法
  },
  lifetimes: {
    attached() {
      // 组件生命周期
    }
  }
})
```

## 📋 待实现功能

- [ ] 首页界面开发
- [ ] AI创作页面开发
- [ ] 作品集页面开发
- [ ] 个人中心页面开发
- [ ] 通用组件开发
- [ ] 图片上传组件
- [ ] 作品预览组件
- [ ] 分享功能
- [ ] 本地缓存优化
- [ ] 性能优化

## 🔧 调试技巧

1. **使用console.log**进行调试
2. **利用微信开发者工具的调试面板**
3. **检查网络请求**是否正常
4. **使用真机调试**测试实际效果

## 📞 技术支持

- 微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/
- 项目技术支持：31度创意团队
- 问题反馈：通过GitHub Issues提交

---

🎨 **31度文创精灵团队** - 让AI创作触手可及！