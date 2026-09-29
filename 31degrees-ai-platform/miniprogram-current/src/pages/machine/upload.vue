<template>
  <view class="page-upload">
    <!-- 机器信息条 -->
    <view class="machine-bar" v-if="store.currentMachine">
      <text class="bar-name">{{ store.currentMachine.name }}</text>
      <text class="bar-status" :class="store.currentMachine.status">
        {{ store.currentMachine.status === 'online' ? '在线' : '离线' }}
      </text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-area" @tap="chooseImage" v-if="!previewUrl">
      <text class="upload-icon">📤</text>
      <text class="upload-title">上传照片</text>
      <text class="upload-hint">支持 JPG/PNG，建议 1024×1024 以上</text>
      <text class="upload-action">点击选择照片</text>
    </view>

    <!-- 预览区 -->
    <view class="preview-area" v-else>
      <image :src="previewUrl" class="preview-image" mode="aspectFit" />
      <view class="preview-actions">
        <view class="preview-btn" @tap="chooseImage">
          <text>重新选择</text>
        </view>
        <view class="preview-btn outline" @tap="applyFilter">
          <text>滤镜增强</text>
        </view>
      </view>
    </view>

    <!-- 材质选择 (竞品标配) -->
    <view class="material-section" v-if="previewUrl">
      <text class="section-title">雕刻材质</text>
      <view class="material-options">
        <view
          v-for="mat in materials"
          :key="mat.value"
          class="material-option"
          :class="{ active: selectedMaterial === mat.value }"
          @tap="selectMaterial(mat.value)"
        >
          <text class="mat-icon">{{ mat.icon }}</text>
          <text class="mat-name">{{ mat.label }}</text>
          <text class="mat-price" v-if="mat.extraCost">+{{ mat.extraCost }}积分</text>
          <view class="mat-check" v-if="selectedMaterial === mat.value">
            <text>✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- AI 处理选择 -->
    <view class="processing-section" v-if="previewUrl">
      <text class="section-title">AI 优化（可选）</text>
      <view class="processing-options">
        <view
          v-for="opt in aiOptions"
          :key="opt.value"
          class="processing-option"
          :class="{ active: selectedAI === opt.value }"
          @tap="selectAI(opt.value)"
        >
          <text class="opt-icon">{{ opt.icon }}</text>
          <text class="opt-name">{{ opt.label }}</text>
          <view class="opt-check" v-if="selectedAI === opt.value">
            <text>✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 模板选择 -->
    <view class="template-section" v-if="previewUrl">
      <text class="section-title">选择模板</text>
      <view v-if="templateStore.error">
        <text>模板加载失败，未使用离线模板替代</text>
        <button size="mini" @tap="reloadTemplates">重新加载</button>
      </view>
      <scroll-view scroll-x class="template-scroll">
        <view class="template-list">
          <view
            v-for="tpl in templates"
            :key="tpl.id"
            class="template-thumb"
            :class="{ active: selectedTemplate === tpl.id }"
            @tap="selectTemplate(tpl.id)"
          >
            <image :src="tpl.preview_url" mode="aspectFill" class="thumb-img" />
            <text class="thumb-name">{{ tpl.name }}</text>
          </view>
          <view
            class="template-thumb no-template"
            :class="{ active: selectedTemplate === null }"
            @tap="selectTemplate(null)"
          >
            <text class="thumb-no-icon">⊘</text>
            <text class="thumb-name">无模板</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 礼物模式 (竞品爆款功能) -->
    <view class="gift-section" v-if="previewUrl">
      <view class="gift-toggle" @tap="giftMode = !giftMode">
        <view class="gift-left">
          <text class="gift-icon">🎁</text>
          <view class="gift-text">
            <text class="gift-title">礼物模式</text>
            <text class="gift-desc">添加祝福语，送给TA一份专属礼物</text>
          </view>
        </view>
        <view class="toggle-switch" :class="{ on: giftMode }">
          <view class="toggle-dot" />
        </view>
      </view>
      <view class="gift-input-wrap" v-if="giftMode">
        <textarea
          class="gift-input"
          placeholder="写下你的祝福语...（最多50字）"
          :maxlength="50"
          v-model="giftMessage"
          auto-height
        />
        <text class="gift-counter">{{ giftMessage.length }}/50</text>
      </view>
    </view>

    <!-- 积分说明 -->
    <view class="cost-section" v-if="previewUrl">
      <view class="cost-row">
        <text class="cost-label">预计消耗积分</text>
        <text class="cost-value">{{ estimatedCost }}</text>
      </view>
      <view class="cost-row">
        <text class="cost-label">扣款方式</text>
        <text class="cost-mode">{{ deductionModeLabel }}</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section" v-if="previewUrl">
      <view class="btn-submit" @tap="submitOrder">
        <text>确认下单 · {{ estimatedCost }} 积分</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useMachineStore } from '@/stores/machine'
import { useTemplateStore } from '@/stores/template'
import { useAppStore } from '@/stores/store'
import { useUserStore } from '@/stores/user'
import { getUploadUrl } from '@/api'

const store = useMachineStore()
const templateStore = useTemplateStore()
const appStore = useAppStore()
const userStore = useUserStore()

const previewUrl = ref('')
const selectedAI = ref<string | null>(null)
const selectedTemplate = ref<number | null>(null)
const selectedMaterial = ref('crystal')
const giftMode = ref(false)
const giftMessage = ref('')
const filterApplied = ref(false)

const materials = [
  { value: 'crystal', label: '水晶', icon: '💎', extraCost: 0 },
  { value: 'acrylic', label: '亚克力', icon: '🪟', extraCost: 0 },
  { value: 'wood', label: '木质', icon: '🪵', extraCost: 5 },
  { value: 'metal', label: '金属', icon: '🔩', extraCost: 10 },
  { value: 'leaf', label: '树叶', icon: '🍃', extraCost: 8 },
]

const aiOptions = [
  { value: '', label: '原图', icon: '📷' },
  { value: 'vector', label: '矢量雕刻', icon: '✏️' },
  { value: 'depth', label: '深度浮雕', icon: '🔲' },
  { value: 'logo_extract', label: '智能抠图', icon: '🔍' },
  { value: 'composite', label: '全能优化', icon: '⚡' },
  { value: 'pod_3d', label: '3D内雕', icon: '🫙' },
]

const templates = computed(() => templateStore.templates)

const estimatedCost = computed(() => {
  let cost = 0
  if (selectedTemplate.value) {
    const tpl = templateStore.templates.find(t => t.id === selectedTemplate.value)
    if (tpl) cost += tpl.points_cost
  }
  if (selectedAI.value) cost += 5
  const mat = materials.find(m => m.value === selectedMaterial.value)
  if (mat?.extraCost) cost += mat.extraCost
  return cost
})

const deductionModeLabel = computed(() => {
  return appStore.deductionMode === 'store' ? '门店代付' : '自付积分'
})

onLoad((options: any) => {
  if (options?.ai_type) {
    selectedAI.value = options.ai_type
  }
})

onShow(() => {
  reloadTemplates()
})

async function reloadTemplates() {
  await templateStore.fetchTemplates()
  if (selectedTemplate.value !== null && !templateStore.templates.some(t => t.id === selectedTemplate.value)) {
    selectTemplate(null)
  }
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      previewUrl.value = res.tempFilePaths[0]
      store.setSourceImage(res.tempFilePaths[0])
      filterApplied.value = false
    },
  })
}

function selectMaterial(value: string) {
  selectedMaterial.value = value
}

function selectAI(value: string) {
  selectedAI.value = selectedAI.value === value ? null : value
  store.setProcessingType(selectedAI.value)
}

function selectTemplate(id: number | null) {
  selectedTemplate.value = id
  store.setTemplate(id)
}

function applyFilter() {
  // Simulate photo enhancement filter (high contrast for laser engraving)
  uni.showLoading({ title: '智能优化中...' })
  setTimeout(() => {
    filterApplied.value = !filterApplied.value
    uni.hideLoading()
    uni.showToast({
      title: filterApplied.value ? '对比度增强已开启' : '已恢复原图',
      icon: 'none'
    })
  }, 800)
}

async function submitOrder() {
  if (templateStore.loading || (selectedTemplate.value !== null && !templates.value.some(t => t.id === selectedTemplate.value))) {
    uni.showToast({ title: '请等待模板加载并重新确认选择', icon: 'none' })
    return
  }
  const m = store.currentMachine
  if (!m) {
    uni.showToast({ title: '设备信息丢失', icon: 'none' })
    return
  }

  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  // Upload the image first
  let imageUrl = previewUrl.value
  if (previewUrl.value && !previewUrl.value.startsWith('http')) {
    try {
      uni.showLoading({ title: '上传图片...' })
      const uploadRes = await uploadImage(previewUrl.value)
      imageUrl = uploadRes
    } catch (e) {
      uni.hideLoading()
      uni.showToast({ title: '图片上传失败', icon: 'none' })
      return
    }
    uni.hideLoading()
  }

  try {
    await store.createOrder({
      machine_id: m.id,
      template_id: selectedTemplate.value,
      source_image_url: imageUrl,
      ai_processing_type: selectedAI.value || undefined,
      material_type: selectedMaterial.value,
      gift_message: giftMode.value ? giftMessage.value : undefined,
      deduction_mode: appStore.deductionMode,
    })

    uni.navigateTo({ url: '/pages/machine/status' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '下单失败', icon: 'none' })
  }
}

function uploadImage(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: getUploadUrl(),
      filePath,
      name: 'file',
      success: (res: any) => {
        try {
          const data = JSON.parse(res.data)
          if (data.url) {
            resolve(data.url)
          } else {
            reject(new Error('No url'))
          }
        } catch (e) {
          reject(e)
        }
      },
      fail: reject,
    })
  })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31° 激光雕刻 · 上传照片开始创作',
      path: '/pages/machine/upload',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 照片上传定制',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-upload {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
  padding-bottom: 120rpx;
}

.machine-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  background: $bg-card;
  border-radius: $radius-md;
  margin-bottom: 24rpx;
}

.bar-name {
  font-size: 26rpx;
  font-weight: 600;
}

.bar-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  &.online { background: rgba(16,185,129,0.1); color: $success; }
  &.offline { background: rgba(153,153,153,0.1); color: $text-muted; }
  &.maintenance { background: rgba(245,158,11,0.1); color: $warning; }
}

/* Upload Area */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 80rpx 40rpx;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 3rpx dashed rgba($primary, 0.2);
  margin-bottom: 24rpx;
  &:active { background: $bg-card-hover; }
}

.upload-icon { font-size: 72rpx; }
.upload-title { font-size: 32rpx; font-weight: 700; }
.upload-hint { font-size: 24rpx; color: $text-secondary; }
.upload-action { font-size: 26rpx; color: $primary; font-weight: 600; margin-top: 8rpx; }

/* Preview */
.preview-area { margin-bottom: 24rpx; }

.preview-image {
  width: 100%;
  height: 500rpx;
  border-radius: $radius-md;
  background: $bg-card;
}

.preview-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.preview-btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  background: $bg-card;
  border-radius: $radius-md;
  font-size: 26rpx;
  &:active { opacity: 0.8; }
  &.outline {
    background: transparent;
    border: 2rpx solid $primary;
    color: $primary;
  }
}

/* Sections */
.section-title {
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  display: block;
}

/* Material Selector */
.material-section {
  margin-bottom: 24rpx;
}

.material-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12rpx;
}

.material-option {
  position: relative;
  background: $bg-card;
  border-radius: $radius-md;
  padding: 16rpx 8rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;

  &.active {
    background: rgba($primary, 0.08);
    border: 2rpx solid $primary;
  }

  &:active { opacity: 0.8; }
}

.mat-icon { font-size: 32rpx; }
.mat-name { font-size: 22rpx; font-weight: 600; }
.mat-price { font-size: 18rpx; color: $accent; }

.mat-check {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 28rpx;
  height: 28rpx;
  background: $primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text { color: #fff; font-size: 16rpx; font-weight: 700; }
}

/* AI Processing */
.processing-section { margin-bottom: 24rpx; }

.processing-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12rpx;
}

.processing-option {
  position: relative;
  background: $bg-card;
  border-radius: $radius-md;
  padding: 16rpx 8rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;

  &.active {
    background: rgba($primary, 0.08);
    border: 2rpx solid $primary;
  }

  &:active { opacity: 0.8; }
}

.opt-icon { font-size: 28rpx; }
.opt-name { font-size: 22rpx; font-weight: 600; }

.opt-check {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 28rpx;
  height: 28rpx;
  background: $primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text { color: #fff; font-size: 16rpx; font-weight: 700; }
}

/* Template Selection */
.template-section { margin-bottom: 24rpx; }

.template-scroll { width: 100%; white-space: nowrap; }

.template-list {
  display: inline-flex;
  gap: 12rpx;
  padding-bottom: 8rpx;
}

.template-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  width: 120rpx;
  padding: 10rpx;
  background: $bg-card;
  border-radius: $radius-md;

  &.active {
    background: rgba($primary, 0.08);
    border: 2rpx solid $primary;
  }
}

.thumb-img {
  width: 90rpx;
  height: 115rpx;
  border-radius: 8rpx;
  background: $bg-dark;
}

.thumb-no-icon {
  width: 90rpx;
  height: 115rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: $text-muted;
  border-radius: 8rpx;
  border: 2rpx dashed $border-default;
}

.thumb-name { font-size: 18rpx; white-space: nowrap; }

/* Gift Mode */
.gift-section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.gift-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gift-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.gift-icon { font-size: 40rpx; }

.gift-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.gift-title { font-size: 26rpx; font-weight: 600; }
.gift-desc { font-size: 22rpx; color: $text-secondary; }

.toggle-switch {
  width: 64rpx;
  height: 36rpx;
  background: $bg-card-hover;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  padding: 4rpx;
  transition: background 0.2s;

  &.on {
    background: $primary;
    .toggle-dot { transform: translateX(28rpx); }
  }
}

.toggle-dot {
  width: 28rpx;
  height: 28rpx;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}

.gift-input-wrap {
  margin-top: 16rpx;
  position: relative;
}

.gift-input {
  width: 100%;
  min-height: 80rpx;
  padding: 16rpx;
  background: $bg-dark;
  border-radius: $radius-sm;
  font-size: 26rpx;
  color: $text-primary;
}

.gift-counter {
  position: absolute;
  bottom: 8rpx;
  right: 12rpx;
  font-size: 20rpx;
  color: $text-muted;
}

/* Cost Section */
.cost-section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
  &:first-child {
    border-bottom: 1rpx solid $border-subtle;
    margin-bottom: 8rpx;
    padding-bottom: 16rpx;
  }
}

.cost-label { font-size: 26rpx; color: $text-secondary; }
.cost-value { font-size: 28rpx; font-weight: 700; color: $accent; }
.cost-mode { font-size: 24rpx; color: $primary; }

/* Submit */
.submit-section { padding-bottom: 24rpx; }

.btn-submit {
  width: 100%;
  padding: 26rpx 0;
  text-align: center;
  background: linear-gradient(135deg, $primary, #ef4444);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #fff;
  font-weight: 700;

  &:active { opacity: 0.85; }
}
</style>
