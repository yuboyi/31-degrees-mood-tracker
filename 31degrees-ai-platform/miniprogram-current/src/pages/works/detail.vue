<template>
  <view class="detail-page">
    <view v-if="work" class="content">
      <view class="hero">
        <text class="eyebrow">2.5D proofing work</text>
        <text class="title">{{ work.title || '2.5D内雕作品' }}</text>
        <text class="subtitle">{{ work.status || '待确认' }} · {{ work.created_at || '-' }}</text>
      </view>

      <view class="preview-grid">
        <view class="preview-card">
          <text class="preview-title">原图/上传图</text>
          <image v-if="work.source_url" class="preview-image" :src="work.source_url" mode="aspectFit" />
          <text v-else class="empty-text">暂无原图</text>
        </view>
        <view class="preview-card">
          <text class="preview-title">灰度深度图</text>
          <image v-if="work.depth_url" class="preview-image" :src="work.depth_url" mode="aspectFit" />
          <text v-else class="empty-text">暂无灰度图</text>
        </view>
        <view class="preview-card full">
          <text class="preview-title">2.5D预览图</text>
          <image v-if="work.pod3d_url" class="preview-image tall" :src="work.pod3d_url" mode="aspectFit" />
          <text v-else class="empty-text">暂无2.5D预览</text>
        </view>
      </view>

      <view class="info-panel">
        <view class="info-row">
          <text>类型</text>
          <text>{{ work.type === 'image25d' ? '图转2.5D' : '文生2.5D' }}</text>
        </view>
        <view class="info-row">
          <text>风格/处理</text>
          <text>{{ work.style || '-' }}</text>
        </view>
        <view class="info-row">
          <text>任务编号</text>
          <text>#{{ work.task_id || '-' }}</text>
        </view>
        <view class="info-row">
          <text>交付判断</text>
          <text>{{ work.depth_url || work.pod3d_url ? '可提交打样确认' : '需要重新生成' }}</text>
        </view>
      </view>

      <view class="action-panel">
        <button class="primary-btn" @tap="submitSample">提交打样</button>
        <button class="ghost-btn" @tap="copyParams">复制参数</button>
        <button class="ghost-btn" open-type="contact" @tap="contactFallback">联系客服</button>
        <button class="ghost-btn" @tap="goImage25d">继续生成</button>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-title">未找到作品</text>
      <text class="empty-desc">请先在图转2.5D页面生成并保存作品。</text>
      <button class="primary-btn" @tap="goImage25d">去生成</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

const work = ref<any | null>(null)

onLoad((query: any) => {
  loadWork(query?.id || query?.workId)
})

onShow(() => {
  uni.showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  } as any)
})

function loadWork(id?: string | number) {
  const works = uni.getStorageSync('mock_25d_works') || []
  work.value = id ? works.find((item: any) => String(item.id) === String(id)) : works[0]
}

function submitSample() {
  if (!work.value) return
  uni.navigateTo({ url: `/pages/sample/submit?workId=${work.value.id}` })
}

function copyParams() {
  if (!work.value) return
  const text = [
    `作品：${work.value.title || '2.5D内雕作品'}`,
    `类型：${work.value.type || '-'}`,
    `处理：${work.value.style || '-'}`,
    `状态：${work.value.status || '-'}`,
    `任务：${work.value.task_id || '-'}`,
    `灰度图：${work.value.depth_url || '-'}`,
    `预览图：${work.value.pod3d_url || '-'}`,
  ].join('\n')
  uni.setClipboardData({
    data: text,
    success() {
      uni.showToast({ title: '参数已复制', icon: 'success' })
    },
  })
}

function goImage25d() {
  uni.navigateTo({ url: '/pages/image25d/index' })
}

function contactFallback() {
  uni.showToast({ title: '真机微信可联系客服', icon: 'none' })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度2.5D内雕作品确认',
      path: '/pages/works/detail',
    }
  },
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 28rpx 28rpx 72rpx;
  background: linear-gradient(180deg, #210909 0%, #0b0b0d 58%, #050505 100%);
  color: #fff;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 12rpx 0 22rpx;
}

.eyebrow {
  color: #ff8f7b;
  font-size: 22rpx;
}

.title {
  font-size: 42rpx;
  font-weight: 900;
}

.subtitle {
  color: rgba(255, 255, 255, 0.64);
  font-size: 24rpx;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.preview-card,
.info-panel,
.action-panel,
.empty-state {
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8rpx;
}

.preview-card {
  min-height: 260rpx;
  padding: 16rpx;
}

.preview-card.full {
  grid-column: 1 / -1;
}

.preview-title {
  display: block;
  margin-bottom: 12rpx;
  color: rgba(255, 255, 255, 0.72);
  font-size: 24rpx;
  font-weight: 700;
}

.preview-image {
  width: 100%;
  height: 220rpx;
  border-radius: 8rpx;
  background: rgba(0, 0, 0, 0.28);
}

.preview-image.tall {
  height: 420rpx;
}

.info-panel {
  margin-top: 18rpx;
  padding: 18rpx 22rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.72);
  font-size: 24rpx;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row text:last-child {
  color: #fff;
  text-align: right;
}

.action-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 18rpx;
  padding: 18rpx;
}

.primary-btn,
.ghost-btn {
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 8rpx;
  font-size: 25rpx;
  font-weight: 800;
}

.primary-btn {
  background: #e23a3d;
  color: #fff;
}

.ghost-btn {
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.primary-btn::after,
.ghost-btn::after {
  border: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
  margin-top: 180rpx;
  padding: 48rpx 28rpx;
  text-align: center;
}

.empty-title {
  font-size: 34rpx;
  font-weight: 800;
}

.empty-desc,
.empty-text {
  color: rgba(255, 255, 255, 0.62);
  font-size: 24rpx;
  line-height: 1.5;
}
</style>
