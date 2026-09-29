<template>
  <view class="preview-page">
    <view class="hero">
      <text class="eyebrow">开发进行中预览版</text>
      <text class="title">31度 2.5D 内雕小程序</text>
      <text class="subtitle">当前基于 0.1.3 继续开发，不影响线上发布。</text>
    </view>

    <view class="status-grid">
      <view v-for="item in statusCards" :key="item.label" class="status-card">
        <text class="status-value">{{ item.value }}</text>
        <text class="status-label">{{ item.label }}</text>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">可预览入口</text>
        <button class="mini-btn" @tap="copyPreviewChecklist">复制验收清单</button>
      </view>
      <view class="entry-list">
        <view v-for="entry in previewEntries" :key="entry.title" class="entry-item" @tap="goEntry(entry.path, entry.tab)">
          <view>
            <text class="entry-title">{{ entry.title }}</text>
            <text class="entry-desc">{{ entry.desc }}</text>
          </view>
          <text class="entry-arrow">→</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">功能状态</text>
      <view class="check-list">
        <view v-for="item in doneItems" :key="item" class="check-item done">
          <text class="dot"></text>
          <text>{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">真机必点</text>
      <view class="check-list">
        <view v-for="item in realDeviceItems" :key="item" class="check-item">
          <text class="dot warn"></text>
          <text>{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">下一批建议</text>
      <view class="roadmap">
        <view v-for="item in roadmap" :key="item.title" class="roadmap-item">
          <text class="priority">{{ item.priority }}</text>
          <view class="roadmap-copy">
            <text class="roadmap-title">{{ item.title }}</text>
            <text class="roadmap-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const statusCards = [
  { label: '当前小程序版本', value: '0.1.3' },
  { label: '后端接口', value: 'ai.31du.com' },
  { label: '开发预览', value: '已建立' },
  { label: '发布动作', value: '需确认' },
]

const previewEntries = [
  { title: '首页', desc: '四个入口、商城跳转、分享复制入口', path: '/pages/index/index', tab: true },
  { title: '光学激光', desc: '上传照片、生成灰度/内雕/点阵/G-code、下单', path: '/pages/create/index' },
  { title: '我的', desc: '微信快捷登录、手机号快捷绑定、分享复制入口', path: '/pages/my/my', tab: true },
  { title: '订单状态', desc: 'PC 接收端加工状态回传后的查看入口', path: '/pages/orders/index' },
]

const doneItems = [
  '首页四个入口已经成型：彩印喷墨、光学激光、展品签到方案、官方耗材',
  '官方耗材已改为跳转 31度购物商城，并带复制兜底',
  '分享给客户和复制小程序路径入口已进入代码包',
  '我的页已改成微信快捷登录和手机号快捷绑定流程',
  '光学激光 MVP 已具备上传、参数、AI 预览、设备下单链路',
]

const realDeviceItems = [
  '微信快捷登录授权弹窗和后端换 token',
  '手机号授权绑定真实手机号',
  '首页官方耗材跳转到 31度购物商城',
  '微信好友分享和更多菜单复制路径',
  '上传照片后生成真实 2.5D 灰度图并提交加工订单',
]

const roadmap = [
  { priority: 'P0', title: '光学激光正式下单体验', desc: '上传预览、材料尺寸、失败重试、订单状态合成一条更顺的生产流程。' },
  { priority: 'P0', title: '客服和询价转化', desc: '首页和加工页增加咨询报价入口，客户卡住时可以马上联系。' },
  { priority: 'P1', title: 'UV 彩印喷墨 MVP', desc: '上传图片、选择材质尺寸、自动排版、生成打印图，后续接热文件夹。' },
  { priority: 'P1', title: '订单历史筛选', desc: '按设备、状态、工艺筛选，方便客服和生产人员查单。' },
  { priority: 'P2', title: '运营配置化', desc: '把材料、尺寸、工艺文案从代码抽成配置，后续改活动更快。' },
]

function goEntry(path: string, isTab?: boolean) {
  if (isTab) {
    uni.switchTab({ url: path })
    return
  }
  uni.navigateTo({ url: path })
}

function copyPreviewChecklist() {
  const content = [
    '31度 2.5D 内雕小程序验收清单',
    '1. 首页四个入口显示正常',
    '2. 官方耗材可跳转 31度购物商城',
    '3. 我的页微信快捷登录可完成',
    '4. 手机号快捷绑定可完成',
    '5. 光学激光可上传照片并生成预览',
    '6. 选择设备后可提交加工订单',
    '7. PC 接收端可接单、写入热文件夹、回传完成',
  ].join('\n')
  uni.setClipboardData({
    data: content,
    success() {
      uni.showToast({ title: '清单已复制', icon: 'success' })
    },
  })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度 2.5D 内雕小程序开发预览',
      path: '/pages/dev-preview/index?from=share',
    }
  },
}
</script>

<style lang="scss" scoped>
.preview-page {
  min-height: 100vh;
  padding: 28rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #1f0909 0%, #090909 55%, #080808 100%);
  color: #fff;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 18rpx 0 24rpx;
}

.eyebrow {
  color: #ff8f7b;
  font-size: 24rpx;
}

.title {
  font-size: 42rpx;
  font-weight: 700;
}

.subtitle {
  color: rgba(255, 255, 255, 0.72);
  font-size: 26rpx;
  line-height: 1.5;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-bottom: 22rpx;
}

.status-card,
.section {
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8rpx;
}

.status-card {
  min-height: 118rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18rpx;
  box-sizing: border-box;
}

.status-value {
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
}

.status-label {
  margin-top: 6rpx;
  color: rgba(255, 255, 255, 0.58);
  font-size: 22rpx;
}

.section {
  padding: 22rpx;
  margin-bottom: 18rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-bottom: 14rpx;
}

.section-title {
  display: block;
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 14rpx;
}

.mini-btn {
  height: 58rpx;
  line-height: 58rpx;
  padding: 0 22rpx;
  border-radius: 8rpx;
  background: #8f2326;
  color: #fff;
  font-size: 22rpx;
}

.mini-btn::after {
  border: none;
}

.entry-list,
.check-list,
.roadmap {
  display: flex;
  flex-direction: column;
}

.entry-item {
  min-height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.entry-item:last-child,
.check-item:last-child,
.roadmap-item:last-child {
  border-bottom: none;
}

.entry-title,
.roadmap-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}

.entry-desc,
.roadmap-desc {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.62);
  font-size: 23rpx;
  line-height: 1.45;
}

.entry-arrow {
  color: rgba(255, 255, 255, 0.42);
  font-size: 34rpx;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 12rpx 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 24rpx;
  line-height: 1.45;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.dot {
  width: 14rpx;
  height: 14rpx;
  margin-top: 12rpx;
  border-radius: 50%;
  background: #36d17c;
  flex: 0 0 auto;
}

.dot.warn {
  background: #ffb84a;
}

.roadmap-item {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.priority {
  min-width: 64rpx;
  height: 42rpx;
  line-height: 42rpx;
  border-radius: 8rpx;
  text-align: center;
  background: rgba(226, 58, 61, 0.22);
  color: #ff9b8f;
  font-size: 22rpx;
  font-weight: 700;
}

.roadmap-copy {
  flex: 1;
  min-width: 0;
}
</style>
