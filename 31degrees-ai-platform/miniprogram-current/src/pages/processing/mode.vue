<template>
  <view class="page-mode">
    <!-- Source Preview -->
    <view class="source-preview">
      <image :src="store.sourceImage" class="source-img" mode="aspectFit" />
      <view class="source-overlay" v-if="store.loading">
        <text class="overlay-text">处理中...</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: store.progress + '%' }" />
        </view>
      </view>
    </view>

    <!-- Mode Config -->
    <view class="config-section">
      <!-- Depth Map Mode -->
      <template v-if="store.mode === 'depth-map'">
        <view class="config-card">
          <text class="config-title">立体深度图</text>
          <text class="config-desc">
            使用 Depth Anything V2 生成 8-bit 灰度高度图。
            输出原始灰度（非伪彩色），0=远/深，255=近/浅。
          </text>

          <view class="param-row">
            <text class="param-label">背景分割</text>
            <switch
              :checked="enableSegment"
              @change="enableSegment = $event.detail.value"
              color="#dc2626"
            />
          </view>
          <text class="param-hint" v-if="enableSegment">
            先提取主体再生成深度图，背景置零
          </text>

          <button class="btn-primary" @tap="runDepth" :disabled="store.loading">
            {{ store.loading ? '处理中...' : '生成深度图' }}
          </button>
        </view>
      </template>

      <!-- Halftone Mode -->
      <template v-if="store.mode === 'halftone'">
        <view class="config-card">
          <text class="config-title">点阵雕刻</text>
          <text class="config-desc">
            将灰度深度图转换为 1-bit 黑白点阵，适合激光打标。
          </text>

          <view class="param-row">
            <text class="param-label">算法</text>
            <view class="segmented">
              <view
                v-for="m in halftoneMethods"
                :key="m.value"
                class="seg-item"
                :class="{ active: store.halftoneParams.method === m.value }"
                @tap="store.halftoneParams.method = m.value"
              >
                <text>{{ m.label }}</text>
              </view>
            </view>
          </view>

          <view class="param-row">
            <text class="param-label">网点大小: {{ store.halftoneParams.dot_size }}</text>
          </view>
          <view class="slider-wrap">
            <slider
              :value="store.halftoneParams.dot_size"
              min="1" max="16" step="1"
              @change="onDotSize"
              activeColor="#dc2626"
            />
          </view>

          <view class="param-row">
            <text class="param-label">阈值: {{ store.halftoneParams.threshold }}</text>
          </view>
          <view class="slider-wrap">
            <slider
              :value="store.halftoneParams.threshold"
              min="64" max="192" step="1"
              @change="onThreshold"
              activeColor="#dc2626"
            />
          </view>

          <view class="param-row">
            <text class="param-label">先分割再处理</text>
            <switch
              :checked="enableSegment"
              @change="enableSegment = $event.detail.value"
              color="#dc2626"
            />
          </view>

          <button class="btn-primary" @tap="runHalftone" :disabled="store.loading">
            {{ store.loading ? '处理中...' : '生成点阵雕刻' }}
          </button>
        </view>
      </template>

      <!-- Layers Mode -->
      <template v-if="store.mode === 'layers'">
        <view class="config-card">
          <text class="config-title">分层雕刻</text>
          <text class="config-desc">
            将灰度深度图按亮度均匀切分为 N 层，每层输出一张二值图像。
            用于多层雕刻（由深到浅逐层加工）。
          </text>

          <view class="param-row">
            <text class="param-label">层数: {{ store.layersParams.layer_count }}</text>
          </view>
          <view class="slider-wrap">
            <slider
              :value="store.layersParams.layer_count"
              min="2" max="64" step="1"
              @change="onLayerCount"
              activeColor="#dc2626"
            />
          </view>

          <view class="param-row">
            <text class="param-label">反转图层</text>
            <switch
              :checked="store.layersParams.inverted"
              @change="store.layersParams.inverted = $event.detail.value"
              color="#dc2626"
            />
          </view>
          <text class="param-hint" v-if="store.layersParams.inverted">
            浅色区域变为底层（适合由浅到深雕刻）
          </text>

          <view class="param-row">
            <text class="param-label">先分割再处理</text>
            <switch
              :checked="enableSegment"
              @change="enableSegment = $event.detail.value"
              color="#dc2626"
            />
          </view>

          <button class="btn-primary" @tap="runLayers" :disabled="store.loading">
            {{ store.loading ? '处理中...' : '生成图层 ZIP' }}
          </button>
        </view>
      </template>

      <!-- Video Mode -->
      <template v-if="store.mode === 'video'">
        <view class="config-card">
          <text class="config-title">视频雕刻</text>
          <text class="config-desc">
            逐帧提取灰度深度图，重新编码为 MP4 视频。
            限制帧数防止内存溢出。
          </text>

          <view class="param-row">
            <text class="param-label">最大帧数: {{ store.videoParams.frame_limit }}</text>
          </view>
          <view class="slider-wrap">
            <slider
              :value="store.videoParams.frame_limit"
              min="30" max="600" step="10"
              @change="onFrameLimit"
              activeColor="#dc2626"
            />
          </view>

          <view class="info-box">
            <text class="info-text">
              预计处理时间：{{ estimatedTime }} 秒
              （约 {{ store.videoParams.frame_limit }} 帧）
            </text>
          </view>

          <button class="btn-primary" @tap="runVideo" :disabled="store.loading">
            {{ store.loading ? '处理中...' : '开始处理视频' }}
          </button>
        </view>
      </template>

      <!-- Pod 3D Mode -->
      <template v-if="store.mode === 'pod-3d'">
        <view class="config-card">
          <text class="config-title">3D内雕</text>
          <text class="config-desc">
            为舱体/圆柱曲面物体生成立体深度效果。
            支持多通道位深度输出，适配水晶、亚克力等材质立体雕刻。
          </text>

          <view class="param-row">
            <text class="param-label">深度缩放: {{ store.pod3dParams.depth_scale.toFixed(1) }}x</text>
          </view>
          <view class="slider-wrap">
            <slider
              :value="store.pod3dParams.depth_scale"
              min="0.5" max="3.0" step="0.1"
              @change="onDepthScale"
              activeColor="#dc2626"
            />
          </view>

          <view class="param-row">
            <text class="param-label">透视角度: {{ store.pod3dParams.perspective_angle }}°</text>
          </view>
          <view class="slider-wrap">
            <slider
              :value="store.pod3dParams.perspective_angle"
              min="0" max="180" step="5"
              @change="onPerspectiveAngle"
              activeColor="#dc2626"
            />
          </view>

          <view class="param-row">
            <text class="param-label">平滑半径: {{ store.pod3dParams.smooth_radius }}px</text>
          </view>
          <view class="slider-wrap">
            <slider
              :value="store.pod3dParams.smooth_radius"
              min="0" max="20" step="1"
              @change="onSmoothRadius"
              activeColor="#dc2626"
            />
          </view>

          <view class="param-row">
            <text class="param-label">输出位深度</text>
            <view class="segmented">
              <view
                v-for="ch in channelOptions"
                :key="ch.value"
                class="seg-item"
                :class="{ active: store.pod3dParams.output_channels === ch.value }"
                @tap="store.pod3dParams.output_channels = ch.value"
              >
                <text>{{ ch.label }}</text>
              </view>
            </view>
          </view>

          <view class="info-box">
            <text class="info-text">
              3D内雕处理生成曲面深度图，32位TIFF适合专业雕刻软件。
              高深度缩放值增强立体感，大平滑半径柔化边缘。
            </text>
          </view>

          <button class="btn-primary" @tap="runPod" :disabled="store.loading">
            {{ store.loading ? '处理中...' : '生成 3D内雕深度图' }}
          </button>
        </view>
      </template>
    </view>

    <!-- Error display -->
    <view class="error-card" v-if="store.error">
      <text class="error-text">{{ store.error }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useProcessingStore, ProcessingMode } from '@/stores/processing'

const store = useProcessingStore()
const enableSegment = ref(false)

const halftoneMethods = [
  { value: 'floyd-steinberg' as const, label: 'Floyd' },
  { value: 'ordered' as const, label: 'Bayer' },
  { value: 'atkinson' as const, label: 'Atkinson' },
]

const estimatedTime = computed(() => {
  return Math.round(store.videoParams.frame_limit * 0.3)
})

onLoad((options: any) => {
  if (options?.mode) {
    store.setMode(options.mode as ProcessingMode)
    store.error = ''
  }
})

function onDotSize(e: any) {
  store.halftoneParams.dot_size = e.detail.value
}
function onThreshold(e: any) {
  store.halftoneParams.threshold = e.detail.value
}
function onLayerCount(e: any) {
  store.layersParams.layer_count = e.detail.value
}
function onFrameLimit(e: any) {
  store.videoParams.frame_limit = e.detail.value
}
function onDepthScale(e: any) {
  store.pod3dParams.depth_scale = e.detail.value
}
function onPerspectiveAngle(e: any) {
  store.pod3dParams.perspective_angle = e.detail.value
}
function onSmoothRadius(e: any) {
  store.pod3dParams.smooth_radius = e.detail.value
}

const channelOptions = [
  { value: 8, label: '8位' },
  { value: 16, label: '16位' },
  { value: 32, label: '32位' },
]

async function runDepth() {
  store.resetPipeline()
  try {
    if (enableSegment.value) {
      await store.runSegmentation()
    }
    await store.runDepthMap()
    uni.navigateTo({ url: '/pages/processing/preview' })
  } catch {
    // error shown in UI
  }
}

async function runHalftone() {
  store.resetPipeline()
  try {
    if (enableSegment.value) {
      await store.runSegmentation()
      await store.runDepthMap()
    }
    await store.runHalftone()
    uni.navigateTo({ url: '/pages/processing/preview' })
  } catch {
    // error shown in UI
  }
}

async function runLayers() {
  store.resetPipeline()
  try {
    if (enableSegment.value) {
      await store.runSegmentation()
      await store.runDepthMap()
    }
    await store.runLayers()
    uni.navigateTo({ url: '/pages/processing/preview' })
  } catch {
    // error shown in UI
  }
}

async function runVideo() {
  store.resetPipeline()
  try {
    await store.runVideoPipeline()
    uni.navigateTo({ url: '/pages/processing/preview' })
  } catch {
    // error shown in UI
  }
}

async function runPod() {
  store.resetPipeline()
  try {
    await store.runPod3D()
    uni.navigateTo({ url: '/pages/processing/preview' })
  } catch {
    // error shown in UI
  }
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31° 激光雕刻 · AI图像处理模式选择',
      path: '/pages/processing/mode',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 立体深度图/点阵雕刻/分层多种处理模式',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-mode {
  min-height: 100vh;
  background: $bg-dark;
}

.source-preview {
  width: 100%;
  aspect-ratio: 1;
  background: #1a1a2e;
  position: relative;
}

.source-img {
  width: 100%;
  height: 100%;
}

.source-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.overlay-text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
}

.progress-bar {
  width: 320rpx;
  height: 8rpx;
  background: rgba(255,255,255,0.2);
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $primary;
  border-radius: 4rpx;
  transition: width 0.3s;
}

.config-section {
  padding: 24rpx;
}

.config-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx;
  box-shadow: $shadow-card;
}

.config-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: 8rpx;
}

.config-desc {
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.5;
  display: block;
  margin-bottom: 24rpx;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-top: 1rpx solid $border-subtle;
}

.param-label {
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 600;
}

.param-hint {
  font-size: 20rpx;
  color: $text-muted;
  padding-bottom: 12rpx;
  display: block;
}

.slider-wrap {
  padding: 0 8rpx 8rpx;
}

.segmented {
  display: flex;
  gap: 4rpx;
  background: $bg-card-hover;
  border-radius: 12rpx;
  padding: 4rpx;
}

.seg-item {
  padding: 8rpx 20rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  color: $text-secondary;
  transition: all 0.2s;

  &.active {
    background: $primary;
    color: #fff;
  }
}

.info-box {
  background: rgba($primary, 0.08);
  border-radius: $radius-md;
  padding: 16rpx;
  margin: 16rpx 0;
}

.info-text {
  font-size: 22rpx;
  color: $text-secondary;
  line-height: 1.5;
}

.btn-primary {
  width: 100%;
  margin-top: 24rpx;
  background: $primary;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  border-radius: $radius-md;
  padding: 24rpx 0;

  &[disabled] {
    opacity: 0.6;
  }
}

.error-card {
  margin: 0 24rpx 24rpx;
  background: rgba($danger, 0.08);
  border-radius: $radius-md;
  padding: 20rpx;
  border: 1rpx solid rgba($danger, 0.2);
}

.error-text {
  font-size: 24rpx;
  color: $danger;
}
</style>
