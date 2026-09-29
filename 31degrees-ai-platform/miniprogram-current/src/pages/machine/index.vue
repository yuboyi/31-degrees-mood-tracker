<template>
  <view class="page-machine">
    <!-- 加载中 -->
    <view class="loading-center" v-if="store.loading">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">连接设备中...</text>
    </view>

    <!-- 机器信息卡片 -->
    <template v-else-if="store.currentMachine">
      <view class="machine-card" :class="{ offline: !store.isMachineOnline }">
        <view class="machine-header">
          <view class="machine-status-dot" :class="store.currentMachine.status" />
          <text class="machine-name">{{ store.currentMachine.name }}</text>
          <text class="machine-type">{{ store.currentMachine.machine_type }}</text>
        </view>
        <view class="machine-info">
          <text class="machine-code">编号：{{ store.currentMachine.machine_code }}</text>
          <text v-if="store.currentMachine.store" class="machine-store">门店：{{ store.currentMachine.store.name }}</text>
        </view>
        <view v-if="!store.isMachineOnline" class="machine-offline-notice">
          <text>该设备当前离线，暂时无法提交订单</text>
        </view>
      </view>

      <!-- 操作区 -->
      <view class="action-section">
        <text class="section-title">选择制作方式</text>

        <!-- 选项1：使用模板 -->
        <view class="action-card" @tap="goTemplateSquare">
          <view class="action-icon-wrap" style="background: rgba(22,119,255,0.1)">
            <text class="action-icon">🎨</text>
          </view>
          <view class="action-info">
            <text class="action-label">选择模板</text>
            <text class="action-desc">使用预设模板 + 照片，快速制作</text>
          </view>
          <text class="action-arrow">→</text>
        </view>

        <!-- 选项2：直接上传 -->
        <view class="action-card" @tap="goUpload">
          <view class="action-icon-wrap" style="background: rgba(16,185,129,0.1)">
            <text class="action-icon">📷</text>
          </view>
          <view class="action-info">
            <text class="action-label">上传照片</text>
            <text class="action-desc">直接上传，支持 AI 智能优化</text>
          </view>
          <text class="action-arrow">→</text>
        </view>
      </view>

      <!-- AI 处理选项预览 -->
      <view class="ai-section">
        <text class="section-title">AI 高级处理</text>
        <view class="ai-options">
          <view class="ai-option" @tap="goUploadWithAI('vector')">
            <text class="ai-icon">✏️</text>
            <text class="ai-name">矢量雕刻</text>
            <text class="ai-desc">图片转激光矢量线条</text>
          </view>
          <view class="ai-option" @tap="goUploadWithAI('depth')">
            <text class="ai-icon">🔲</text>
            <text class="ai-name">深度浮雕</text>
            <text class="ai-desc">深度估计立体效果</text>
          </view>
          <view class="ai-option" @tap="goUploadWithAI('logo_extract')">
            <text class="ai-icon">🔍</text>
            <text class="ai-name">智能抠图</text>
            <text class="ai-desc">AI 语义分割去背景</text>
          </view>
          <view class="ai-option" @tap="goUploadWithAI('composite')">
            <text class="ai-icon">⚡</text>
            <text class="ai-name">全能优化</text>
            <text class="ai-desc">矢量+深度一步到位</text>
          </view>
          <view class="ai-option" @tap="goUploadWithAI('pod_3d')">
            <text class="ai-icon">🫙</text>
            <text class="ai-name">3D内雕</text>
            <text class="ai-desc">水晶内部立体雕刻</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 机器未找到 -->
    <view class="error-center" v-else>
      <text class="error-icon">😞</text>
      <text class="error-title">设备未找到</text>
      <text class="error-desc">请重新扫描机器二维码</text>
      <view class="btn-back" @tap="goBack">
        <text>返回首页</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useMachineStore } from '@/stores/machine'

const store = useMachineStore()

onLoad((options: any) => {
  const code = options?.machine_code || options?.code || ''
  if (code) {
    store.resolveMachineCode(code).catch((e) => {
      uni.showToast({ title: e.message || '连接失败', icon: 'none' })
    })
  }
})

onUnload(() => {
  // Don't reset machine info so user can come back
})

function goTemplateSquare() {
  const m = store.currentMachine
  if (!m) return
  // tabBar 页面不能用 navigateTo，用 switchTab 跳转，机器信息已保存在 store 中
  uni.switchTab({ url: '/pages/index/index' })
}

function goUpload() {
  uni.navigateTo({ url: '/pages/machine/upload' })
}

function goUploadWithAI(type: string) {
  store.setProcessingType(type)
  uni.navigateTo({ url: `/pages/machine/upload?ai_type=${type}` })
}

function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31° 激光雕刻设备 · 连接设备开始定制',
      path: '/pages/machine/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 连接雕刻设备，开启创作之旅',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-machine {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
}

.loading-center, .error-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
  gap: 16rpx;
}

.loading-icon, .error-icon {
  font-size: 64rpx;
}

.loading-text {
  font-size: 28rpx;
  color: $text-secondary;
}

.error-title {
  font-size: 32rpx;
  font-weight: 700;
}

.error-desc {
  font-size: 24rpx;
  color: $text-secondary;
}

.btn-back {
  margin-top: 24rpx;
  padding: 16rpx 48rpx;
  background: $primary;
  color: #fff;
  font-size: 28rpx;
  border-radius: $radius-md;
}

/* Machine Card */
.machine-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border-left: 6rpx solid $success;

  &.offline {
    border-left-color: $text-muted;
    opacity: 0.7;
  }
}

.machine-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.machine-status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;

  &.online { background: $success; }
  &.offline { background: $text-muted; }
  &.maintenance { background: $warning; }
}

.machine-name {
  font-size: 32rpx;
  font-weight: 700;
  flex: 1;
}

.machine-type {
  font-size: 22rpx;
  color: $text-secondary;
  background: $bg-card-hover;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}

.machine-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.machine-code, .machine-store {
  font-size: 24rpx;
  color: $text-secondary;
}

.machine-offline-notice {
  margin-top: 16rpx;
  padding: 12rpx;
  background: rgba(245,158,11,0.1);
  border-radius: 8rpx;

  text {
    font-size: 22rpx;
    color: $warning;
  }
}

/* Actions */
.action-section {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  display: block;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 12rpx;

  &:active {
    background: $bg-card-hover;
  }
}

.action-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  font-size: 36rpx;
}

.action-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.action-label {
  font-size: 28rpx;
  font-weight: 600;
}

.action-desc {
  font-size: 22rpx;
  color: $text-secondary;
}

.action-arrow {
  font-size: 32rpx;
  color: $text-muted;
}

/* AI Options */
.ai-section {
  margin-bottom: 24rpx;
}

.ai-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.ai-option {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;

  &:active {
    background: $bg-card-hover;
    transform: scale(0.96);
  }
}

.ai-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.ai-name {
  font-size: 26rpx;
  font-weight: 600;
}

.ai-desc {
  font-size: 20rpx;
  color: $text-secondary;
}
</style>
