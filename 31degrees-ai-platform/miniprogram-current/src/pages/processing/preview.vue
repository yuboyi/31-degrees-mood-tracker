<template>
  <view class="page-preview">
    <!-- Comparison View -->
    <view class="compare-section">
      <view class="compare-panel">
        <text class="panel-label">原始图像</text>
        <image :src="store.sourceImage" class="panel-img" mode="aspectFit" />
      </view>
      <view class="compare-divider" />
      <view class="compare-panel">
        <text class="panel-label">{{ resultLabel }}</text>
        <image
          v-if="previewUrl"
          :src="previewUrl"
          class="panel-img"
          mode="aspectFit"
        />
        <view v-else class="panel-empty">
          <text class="empty-text">处理中...</text>
        </view>
      </view>
    </view>

    <!-- Result Info -->
    <view class="info-section" v-if="store.canPreview">
      <!-- Depth Map Info -->
      <view class="info-card" v-if="store.hasDepth">
        <text class="info-title">立体深度图</text>
        <view class="info-tags">
          <text class="info-tag">8-bit 灰度</text>
          <text class="info-tag">0=远 255=近</text>
          <text class="info-tag">PNG</text>
        </view>
      </view>

      <!-- Halftone Info -->
      <view class="info-card" v-if="store.hasHalftone">
        <text class="info-title">点阵雕刻</text>
        <view class="info-tags">
          <text class="info-tag">1-bit 黑白</text>
          <text class="info-tag">{{ store.halftoneParams.method }}</text>
          <text class="info-tag">网点 {{ store.halftoneParams.dot_size }}</text>
        </view>
      </view>

      <!-- Layers Info -->
      <view class="info-card" v-if="store.hasLayers">
        <text class="info-title">图层堆叠</text>
        <view class="info-tags">
          <text class="info-tag">{{ store.layerCount }} 层</text>
          <text class="info-tag">ZIP</text>
          <text class="info-tag" v-if="store.layersParams.inverted">已反转</text>
        </view>
      </view>

      <!-- Video Info -->
      <view class="info-card" v-if="store.hasVideo">
        <text class="info-title">视频雕刻</text>
        <view class="info-tags">
          <text class="info-tag">{{ store.videoFrameCount }} 帧</text>
          <text class="info-tag">{{ store.videoDuration }}s</text>
          <text class="info-tag">MP4</text>
        </view>
      </view>

      <!-- Pod 3D Info -->
      <view class="info-card" v-if="store.hasPod3D">
        <text class="info-title">3D内雕深度</text>
        <view class="info-tags">
          <text class="info-tag">{{ store.pod3dParams.depth_scale }}x 深度</text>
          <text class="info-tag">{{ store.pod3dParams.perspective_angle }}° 透视</text>
          <text class="info-tag">{{ store.pod3dParams.smooth_radius }}px 平滑</text>
          <text class="info-tag">{{ store.pod3dParams.output_channels }}位</text>
        </view>
      </view>
    </view>

    <!-- Layer Preview (for layers mode) -->
    <view class="layers-section" v-if="store.hasLayers && store.layerUrls.length > 0">
      <text class="section-title">图层预览（前 8 层）</text>
      <scroll-view scroll-x class="layer-scroll">
        <view class="layer-list">
          <view
            v-for="(url, idx) in store.layerUrls.slice(0, 8)"
            :key="idx"
            class="layer-item"
          >
            <image :src="url" class="layer-thumb" mode="aspectFit" />
            <text class="layer-num">第 {{ idx + 1 }} 层</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Action Buttons -->
    <view class="actions">
      <button class="btn-secondary" @tap="goBack">
        重新处理
      </button>
      <button class="btn-primary" @tap="goExport" :disabled="!store.canPreview">
        导出结果
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProcessingStore } from '@/stores/processing'

const store = useProcessingStore()

const resultLabel = computed(() => {
  const map: Record<string, string> = {
    'depth-map': '立体深度图',
    halftone: '点阵雕刻',
    layers: '图层堆叠',
    video: '视频雕刻',
    'pod-3d': '3D内雕',
  }
  return map[store.mode || ''] || '处理结果'
})

const previewUrl = computed(() => {
  if (store.mode === 'depth-map') return store.depthUrl
  if (store.mode === 'halftone') return store.halftoneUrl
  if (store.mode === 'layers') return store.layerUrls[0] || store.depthUrl
  if (store.mode === 'video') return store.depthUrl  // first frame
  if (store.mode === 'pod-3d') return store.pod3dUrl
  return ''
})

function goBack() {
  uni.navigateBack()
}

function goExport() {
  uni.navigateTo({ url: '/pages/processing/export' })
}
</script>

<script lang="ts">
import { useProcessingStore } from '@/stores/processing'

export default {
  onShareAppMessage() {
    const store = useProcessingStore()
    return {
      title: '31度激光雕刻 · 立体深度图/点阵雕刻/分层处理结果',
      path: '/pages/processing/preview',
      imageUrl: store.depthUrl || store.halftoneUrl || '',
    }
  },
  onShareTimeline() {
    const store = useProcessingStore()
    return {
      title: '31度激光雕刻 · AI图像处理效果预览',
      imageUrl: store.depthUrl || store.halftoneUrl || '',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-preview {
  min-height: 100vh;
  background: $bg-dark;
  padding-bottom: 40rpx;
}

.compare-section {
  display: flex;
  background: #1a1a2e;
  padding: 8rpx;
}

.compare-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.panel-label {
  font-size: 20rpx;
  color: rgba(255,255,255,0.7);
  padding: 12rpx 0 8rpx;
}

.panel-img {
  width: 100%;
  aspect-ratio: 1;
}

.panel-empty {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  color: rgba(255,255,255,0.4);
  font-size: 24rpx;
}

.compare-divider {
  width: 2rpx;
  background: rgba(255,255,255,0.15);
}

.info-section {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 20rpx 24rpx;
}

.info-title {
  font-size: 24rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: 10rpx;
}

.info-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.info-tag {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  background: rgba($primary, 0.1);
  color: $primary;
}

.layers-section {
  padding: 0 24rpx 24rpx;
}

.section-title {
  font-size: 26rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: 16rpx;
}

.layer-scroll {
  width: 100%;
  white-space: nowrap;
}

.layer-list {
  display: inline-flex;
  gap: 12rpx;
}

.layer-item {
  width: 140rpx;
  text-align: center;
  display: inline-block;
}

.layer-thumb {
  width: 140rpx;
  height: 140rpx;
  background: $bg-card;
  border-radius: $radius-md;
  display: block;
}

.layer-num {
  font-size: 18rpx;
  color: $text-secondary;
  margin-top: 6rpx;
  display: block;
}

.actions {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
}

.btn-secondary {
  flex: 1;
  background: $bg-card;
  color: $text-primary;
  font-size: 26rpx;
  font-weight: 600;
  border-radius: $radius-md;
  padding: 22rpx 0;
  border: 1rpx solid $border-subtle;
}

.btn-primary {
  flex: 1;
  background: $primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  border-radius: $radius-md;
  padding: 22rpx 0;

  &[disabled] {
    opacity: 0.5;
  }
}
</style>
