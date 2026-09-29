<template>
  <view class="page-export">
    <!-- Result Preview Thumbnail -->
    <view class="result-thumb-wrap">
      <image
        v-if="previewUrl"
        :src="previewUrl"
        class="result-thumb"
        mode="aspectFit"
      />
    </view>

    <!-- Export Format Cards -->
    <view class="export-section">
      <text class="section-title">选择导出格式</text>

      <!-- PNG export (depth map / halftone) -->
      <view
        class="export-card"
        v-if="store.hasDepth || store.hasHalftone"
        @tap="savePNG"
      >
        <view class="export-left">
          <text class="export-icon">🖼️</text>
          <view class="export-info">
            <text class="export-name">PNG 图像</text>
            <text class="export-desc">
              {{ store.mode === 'halftone' ? '1-bit 黑白点阵' : '8-bit 灰度高度图' }}
            </text>
          </view>
        </view>
        <text class="export-action">保存</text>
      </view>

      <!-- Layers ZIP -->
      <view
        class="export-card"
        v-if="store.hasLayers"
        @tap="saveZIP"
      >
        <view class="export-left">
          <text class="export-icon">📦</text>
          <view class="export-info">
            <text class="export-name">图层 ZIP 包</text>
            <text class="export-desc">{{ store.layerCount }} 张二值 PNG 图层</text>
          </view>
        </view>
        <text class="export-action">下载</text>
      </view>

      <!-- Individual layers -->
      <view
        class="export-card"
        v-if="store.hasLayers && store.layerUrls.length > 0"
        @tap="saveIndividualLayers"
      >
        <view class="export-left">
          <text class="export-icon">📄</text>
          <view class="export-info">
            <text class="export-name">单层独立文件</text>
            <text class="export-desc">逐张保存所有图层 PNG</text>
          </view>
        </view>
        <text class="export-action">保存</text>
      </view>

      <!-- Video MP4 -->
      <view
        class="export-card"
        v-if="store.hasVideo"
        @tap="saveVideo"
      >
        <view class="export-left">
          <text class="export-icon">🎬</text>
          <view class="export-info">
            <text class="export-name">MP4 视频</text>
            <text class="export-desc">
              灰度深度视频 · {{ store.videoFrameCount }} 帧 · {{ store.videoDuration }}s
            </text>
          </view>
        </view>
        <text class="export-action">保存</text>
      </view>

      <!-- Pod 3D Depth Map -->
      <view
        class="export-card"
        v-if="store.hasPod3D"
        @tap="savePod3D"
      >
        <view class="export-left">
          <text class="export-icon">🫙</text>
          <view class="export-info">
            <text class="export-name">3D内雕深度图</text>
            <text class="export-desc">
              {{ store.pod3dParams.output_channels }}位舱体曲面深度 · {{ store.pod3dParams.depth_scale }}x 缩放
            </text>
          </view>
        </view>
        <text class="export-action">保存</text>
      </view>

      <!-- Params JSON (always available) -->
      <view class="export-card" @tap="exportParamsJSON">
        <view class="export-left">
          <text class="export-icon">📋</text>
          <view class="export-info">
            <text class="export-name">参数 JSON</text>
            <text class="export-desc">雕刻参数配置文件，可导入激光软件</text>
          </view>
        </view>
        <text class="export-action">导出</text>
      </view>

      <!-- G-code export (31° hardware) -->
      <view class="export-card" @tap="exportGcode">
        <view class="export-left">
          <text class="export-icon">⚙️</text>
          <view class="export-info">
            <text class="export-name">G-code 雕刻文件</text>
            <text class="export-desc">GRBL/Marlin 标准 G-code · 31° 激光机直接读取</text>
          </view>
        </view>
        <text class="export-action">生成</text>
      </view>
    </view>

    <!-- Done button -->
    <view class="done-section">
      <button class="btn-outline" @tap="goCreate">处理新照片</button>
      <button class="btn-primary" @tap="goWorks">查看作品集</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProcessingStore } from '@/stores/processing'
import { api } from '@/api'

const store = useProcessingStore()

const previewUrl = computed(() => {
  if (store.mode === 'halftone') return store.halftoneUrl
  if (store.mode === 'layers') return store.layerUrls[0] || store.depthUrl
  if (store.mode === 'depth-map') return store.depthUrl
  if (store.mode === 'pod-3d') return store.pod3dUrl
  return store.sourceImage
})

function savePNG() {
  const url = store.mode === 'halftone' ? store.halftoneUrl : store.depthUrl
  if (!url) {
    uni.showToast({ title: '无可用图像', icon: 'none' })
    return
  }
  // Preview and save
  uni.previewImage({
    urls: [url],
    current: url,
    success: () => {
      uni.showToast({ title: '长按图片可保存', icon: 'none', duration: 2000 })
    },
  })
}

function saveZIP() {
  if (!store.layersZipUrl) {
    uni.showToast({ title: 'ZIP 文件不可用', icon: 'none' })
    return
  }
  uni.downloadFile({
    url: store.layersZipUrl,
    success: (res) => {
      uni.saveFile({
        tempFilePath: res.tempFilePath,
        success: (saveRes) => {
          uni.showToast({ title: 'ZIP 已保存', icon: 'success' })
        },
        fail: () => {
          uni.showToast({ title: '保存失败', icon: 'none' })
        },
      })
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' })
    },
  })
}

async function saveIndividualLayers() {
  uni.showLoading({ title: '保存中...' })
  let saved = 0
  for (const url of store.layerUrls) {
    try {
      await new Promise<void>((resolve) => {
        uni.downloadFile({
          url,
          success: (res) => {
            uni.saveFile({
              tempFilePath: res.tempFilePath,
              success: () => { saved++; resolve() },
              fail: () => resolve(),
            })
          },
          fail: () => resolve(),
        })
      })
    } catch { /* continue */ }
  }
  uni.hideLoading()
  uni.showToast({ title: `已保存 ${saved}/${store.layerUrls.length} 张`, icon: 'none' })
}

function savePod3D() {
  if (!store.pod3dUrl) {
    uni.showToast({ title: '无可用图像', icon: 'none' })
    return
  }
  uni.previewImage({
    urls: [store.pod3dUrl],
    current: store.pod3dUrl,
    success: () => {
      uni.showToast({ title: '长按图片可保存', icon: 'none', duration: 2000 })
    },
  })
}

function saveVideo() {
  if (!store.videoOutputPath) {
    uni.showToast({ title: '视频不可用', icon: 'none' })
    return
  }
  uni.saveFile({
    tempFilePath: store.videoOutputPath,
    success: () => {
      uni.showToast({ title: '视频已保存', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '保存失败', icon: 'none' })
    },
  })
}

function exportParamsJSON() {
  const params = {
    mode: store.mode,
    timestamp: new Date().toISOString(),
    halftone: store.mode === 'halftone' ? store.halftoneParams : null,
    layers: store.mode === 'layers' ? {
      ...store.layersParams,
      actual_count: store.layerCount,
    } : null,
    video: store.mode === 'video' ? {
      ...store.videoParams,
      frame_count: store.videoFrameCount,
      duration: store.videoDuration,
    } : null,
  }

  const json = JSON.stringify(params, null, 2)
  uni.setClipboardData({
    data: json,
    success: () => {
      uni.showToast({ title: '参数 JSON 已复制', icon: 'success' })
    },
  })
}

async function exportGcode() {
  // Pick the best image: halftone first (1-bit), then depth map (8-bit)
  const imageUrl = store.halftoneUrl || store.depthUrl || store.sourceImage
  if (!imageUrl) {
    uni.showToast({ title: '无可用图像生成 G-code', icon: 'none' })
    return
  }

  uni.showLoading({ title: '生成 G-code...' })
  try {
    const method = store.mode === 'halftone' ? 'vector' : 'raster'
    const res: any = await api.processing.gcode(imageUrl, method)
    uni.hideLoading()

    if (res.gcode_url) {
      // Download the full G-code file
      uni.downloadFile({
        url: res.gcode_url,
        success: (downloadRes) => {
          uni.saveFile({
            tempFilePath: downloadRes.tempFilePath,
            success: () => {
              uni.showToast({ title: `G-code (${res.lines} 行) 已保存`, icon: 'success' })
            },
            fail: () => {
              uni.showToast({ title: '保存失败，请重试', icon: 'none' })
            },
          })
        },
        fail: () => {
          // Fallback: copy preview to clipboard
          if (res.gcode_text) {
            uni.setClipboardData({
              data: res.gcode_text,
              success: () => {
                uni.showToast({ title: `G-code 预览已复制 (${res.lines} 行)`, icon: 'none', duration: 2500 })
              },
            })
          } else {
            uni.showToast({ title: '下载失败', icon: 'none' })
          }
        },
      })
    } else if (res.gcode_text) {
      // No download URL, copy preview text
      uni.setClipboardData({
        data: res.gcode_text,
        success: () => {
          uni.showToast({ title: `G-code (${res.lines} 行) 已复制`, icon: 'success', duration: 2500 })
        },
      })
    }
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e.message || 'G-code 生成失败', icon: 'none' })
  }
}

function goCreate() {
  store.resetAll()
  uni.navigateTo({ url: '/pages/create/index' })
}

function goWorks() {
  uni.navigateTo({ url: '/pages/works/index' })
}
</script>

<script lang="ts">
import { useProcessingStore } from '@/stores/processing'

export default {
  onShareAppMessage() {
    const store = useProcessingStore()
    return {
      title: '31度激光雕刻 · 导出自定义雕刻数据',
      path: '/pages/processing/export',
      imageUrl: store.halftoneUrl || store.depthUrl || store.layerUrls[0] || '',
    }
  },
  onShareTimeline() {
    const store = useProcessingStore()
    return {
      title: '31度激光雕刻 · 支持PNG/ZIP/MP4/G-code导出',
      imageUrl: store.halftoneUrl || store.depthUrl || store.layerUrls[0] || '',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-export {
  min-height: 100vh;
  background: $bg-dark;
}

.result-thumb-wrap {
  width: 100%;
  aspect-ratio: 1;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-thumb {
  width: 100%;
  height: 100%;
}

.export-section {
  padding: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: 16rpx;
}

.export-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: $shadow-card;

  &:active { opacity: 0.7; }
}

.export-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.export-icon {
  font-size: 44rpx;
}

.export-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.export-name {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-primary;
}

.export-desc {
  font-size: 20rpx;
  color: $text-secondary;
}

.export-action {
  font-size: 24rpx;
  color: $primary;
  font-weight: 600;
  padding: 8rpx 20rpx;
  background: rgba($primary, 0.08);
  border-radius: 32rpx;
}

.done-section {
  display: flex;
  gap: 16rpx;
  padding: 0 24rpx 40rpx;
}

.btn-outline {
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
}
</style>
