<template>
  <view class="status-page">
    <view class="state-card" :class="statusClass">
      <text class="state-kicker">订单 #{{ orderIdText }}</text>
      <text class="state-title">{{ statusTitle }}</text>
      <text class="state-desc">{{ statusDesc }}</text>
      <view class="progress-track">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }" />
      </view>
      <view class="step-row">
        <view
          v-for="step in steps"
          :key="step.key"
          class="step"
          :class="{ active: step.active, done: step.done }"
        >
          <text class="step-dot">{{ step.done ? '✓' : step.index }}</text>
          <text class="step-label">{{ step.label }}</text>
        </view>
      </view>
    </view>

    <view class="preview-card" v-if="sourceImage || processedImage">
      <view class="preview-head">
        <text class="section-title">加工预览</text>
        <text class="preview-action" v-if="processedImage" @tap="previewProcessed">查看大图</text>
      </view>
      <view class="preview-grid">
        <view class="preview-cell" v-if="sourceImage">
          <image :src="sourceImage" mode="aspectFit" />
          <text>原图</text>
        </view>
        <view class="preview-cell" v-if="processedImage">
          <image :src="processedImage" mode="aspectFit" />
          <text>加工图</text>
        </view>
      </view>
    </view>

    <view class="info-card" v-if="order">
      <text class="section-title">加工信息</text>
      <view class="info-row">
        <text>设备</text>
        <text>#{{ order.machine_id }}</text>
      </view>
      <view class="info-row">
        <text>材料</text>
        <text>{{ materialLabel }}</text>
      </view>
      <view class="info-row">
        <text>工艺</text>
        <text>{{ processLabel }}</text>
      </view>
      <view class="info-row">
        <text>尺寸</text>
        <text>{{ engravingParams.size || '-' }}</text>
      </view>
      <view class="info-row">
        <text>输出</text>
        <text>{{ engravingParams.output_format || '-' }}</text>
      </view>
      <view class="info-row" v-if="order.machine_message_id">
        <text>接收编号</text>
        <text>{{ order.machine_message_id }}</text>
      </view>
      <view class="info-row">
        <text>创建时间</text>
        <text>{{ order.created_at || '-' }}</text>
      </view>
    </view>

    <view class="error-card" v-if="status === 'failed'">
      <text class="error-title">处理失败</text>
      <text class="error-msg">{{ order?.error_message || '请重试，或检查后端、AI Worker、PC 接收端是否在线' }}</text>
      <button class="danger-btn" @tap="handleRetry">重新处理</button>
    </view>

    <view class="actions">
      <button class="secondary-btn" @tap="copyOrderInfo">复制订单信息</button>
      <button class="primary-btn" v-if="status === 'printed'" @tap="goCreate">再做一单</button>
      <button class="primary-btn" v-else @tap="refreshOrder">刷新状态</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { api } from '@/api'
import { useMachineStore, type MachineOrder } from '@/stores/machine'

const store = useMachineStore()
const order = ref<MachineOrder | null>(null)
const loading = ref(false)
const activeOrderId = ref<number | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const status = computed(() => order.value?.status || store.orderStatus || 'pending')
const orderIdText = computed(() => activeOrderId.value || order.value?.id || store.currentOrder?.id || '-')
const sourceImage = computed(() => order.value?.source_image_url || '')
const processedImage = computed(() => order.value?.processed_image_url || '')
const engravingParams = computed<Record<string, any>>(() => {
  const raw = order.value?.engraving_params
  if (!raw) return {}
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return {}
  }
})

const statusClass = computed(() => {
  if (status.value === 'failed') return 'failed'
  if (status.value === 'printed') return 'done'
  if (['processing', 'ready', 'sent'].includes(status.value)) return 'working'
  return ''
})

const statusTitle = computed(() => {
  const map: Record<string, string> = {
    pending: '订单已提交',
    processing: 'AI 正在处理',
    ready: '等待 PC 接收',
    sent: '已发送到设备',
    printed: '加工完成',
    failed: '处理失败',
  }
  return map[status.value] || '订单处理中'
})

const statusDesc = computed(() => {
  const map: Record<string, string> = {
    pending: '系统正在准备加工任务',
    processing: '正在生成灰度图、点阵图或加工文件',
    ready: '加工文件已生成，等待接收端拉取',
    sent: 'PC 接收端已拿到任务并放入热文件夹',
    printed: '接收端已回传完成状态',
    failed: '任务未完成，请查看错误信息后重试',
  }
  return map[status.value] || ''
})

const progressPercent = computed(() => {
  const map: Record<string, number> = {
    pending: 15,
    processing: 38,
    ready: 62,
    sent: 82,
    printed: 100,
    failed: 6,
  }
  return map[status.value] || 0
})

const stepKeys = ['pending', 'processing', 'ready', 'sent', 'printed']
const steps = computed(() => {
  const current = stepKeys.indexOf(status.value)
  return [
    { key: 'pending', index: 1, label: '提交' },
    { key: 'processing', index: 2, label: '生成' },
    { key: 'ready', index: 3, label: '待接收' },
    { key: 'sent', index: 4, label: '加工' },
    { key: 'printed', index: 5, label: '完成' },
  ].map((item, index) => ({
    ...item,
    active: status.value === item.key,
    done: current >= index && status.value !== 'failed',
  }))
})

const materialLabel = computed(() => {
  const map: Record<string, string> = {
    crystal: '水晶',
    acrylic: '亚克力',
    metal: '金属',
    wood: '木质',
    leaf: '树叶',
  }
  return map[order.value?.material_type || ''] || order.value?.material_type || '-'
})

const processLabel = computed(() => {
  const map: Record<string, string> = {
    depth: '2.5D 灰度图',
    'depth-map': '2.5D 灰度图',
    pod_3d: 'AI 内雕图',
    'pod-3d': 'AI 内雕图',
    halftone: '点阵打标',
    gcode: 'G-code',
  }
  return map[order.value?.ai_processing_type || ''] || order.value?.ai_processing_type || '-'
})

onLoad((options: any) => {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  })

  const id = Number(options?.id || store.currentOrder?.id || 0)
  if (id) {
    activeOrderId.value = id
    refreshOrder()
    startPolling()
  }
})

onUnload(() => {
  stopPolling()
})

function startPolling() {
  stopPolling()
  timer = setInterval(() => {
    if (!['printed', 'failed'].includes(status.value)) {
      refreshOrder(false)
    } else {
      stopPolling()
    }
  }, 2000)
}

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

async function refreshOrder(showLoading = true) {
  if (!activeOrderId.value || loading.value) return
  loading.value = true
  if (showLoading) uni.showLoading({ title: '刷新中...' })
  try {
    const res: any = await api.machine.getOrderStatus(activeOrderId.value)
    order.value = res as MachineOrder
    store.currentOrder = res as MachineOrder
    store.orderStatus = res.status || 'pending'
    if (['printed', 'failed'].includes(res.status)) stopPolling()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '刷新失败', icon: 'none' })
  } finally {
    if (showLoading) uni.hideLoading()
    loading.value = false
  }
}

async function handleRetry() {
  if (!activeOrderId.value) return
  try {
    uni.showLoading({ title: '重试中...' })
    await api.machine.retryOrder(activeOrderId.value)
    await refreshOrder(false)
    startPolling()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '重试失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function previewProcessed() {
  if (!processedImage.value) return
  uni.previewImage({
    urls: [processedImage.value],
    current: processedImage.value,
  })
}

function copyOrderInfo() {
  const text = [
    `订单：#${orderIdText.value}`,
    `状态：${statusTitle.value}`,
    `材料：${materialLabel.value}`,
    `工艺：${processLabel.value}`,
    `尺寸：${engravingParams.value.size || '-'}`,
    `加工图：${processedImage.value || '-'}`,
  ].join('\n')
  uni.setClipboardData({
    data: text,
    success() {
      uni.showToast({ title: '订单信息已复制', icon: 'success' })
    },
  })
}

function goCreate() {
  uni.redirectTo({ url: '/pages/create/index' })
}
</script>

<script lang="ts">
import { useMachineStore } from '@/stores/machine'

export default {
  onShareAppMessage() {
    const store = useMachineStore()
    const order = store.currentOrder
    return {
      title: `31度光学激光订单 #${order?.id || ''}`,
      path: order?.id ? `/pages/machine/status?id=${order.id}` : '/pages/create/index',
      imageUrl: order?.processed_image_url || order?.source_image_url || '',
    }
  },
  onShareTimeline() {
    const store = useMachineStore()
    const order = store.currentOrder
    return {
      title: '31度光学激光定制',
      query: order?.id ? `id=${order.id}` : '',
      imageUrl: order?.processed_image_url || order?.source_image_url || '',
    }
  },
}
</script>

<style lang="scss" scoped>
.status-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24rpx 24rpx 44rpx;
  background: #111111;
  color: #ffffff;
}

.state-card,
.preview-card,
.info-card,
.error-card {
  border-radius: 12rpx;
  background: #191919;
  padding: 24rpx;
  margin-bottom: 22rpx;
}

.state-card {
  border: 2rpx solid rgba(255, 255, 255, 0.08);
}

.state-card.working {
  border-color: rgba(239, 68, 68, 0.38);
}

.state-card.done {
  border-color: rgba(34, 197, 94, 0.38);
}

.state-card.failed {
  border-color: rgba(239, 68, 68, 0.58);
}

.state-kicker,
.state-title,
.state-desc {
  display: block;
}

.state-kicker {
  color: #ef4444;
  font-size: 22rpx;
  font-weight: 700;
}

.state-title {
  margin-top: 8rpx;
  font-size: 38rpx;
  line-height: 48rpx;
  font-weight: 800;
}

.state-desc {
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 23rpx;
}

.progress-track {
  height: 10rpx;
  margin-top: 28rpx;
  border-radius: 999rpx;
  background: #2b2b2b;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #dc2626;
  transition: width 0.3s ease;
}

.state-card.done .progress-fill {
  background: #22c55e;
}

.step-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8rpx;
  margin-top: 22rpx;
}

.step {
  min-width: 0;
  text-align: center;
  color: #777777;
}

.step-dot {
  width: 34rpx;
  height: 34rpx;
  line-height: 34rpx;
  display: block;
  margin: 0 auto 8rpx;
  border-radius: 50%;
  background: #333333;
  font-size: 18rpx;
}

.step.active,
.step.done {
  color: #ffffff;
}

.step.active .step-dot {
  background: #dc2626;
}

.step.done .step-dot {
  background: #22c55e;
}

.step-label {
  font-size: 19rpx;
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
}

.preview-action {
  color: #ef4444;
  font-size: 22rpx;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.preview-cell {
  min-width: 0;
}

.preview-cell image {
  width: 100%;
  height: 280rpx;
  border-radius: 10rpx;
  background: #0b0b0b;
}

.preview-cell text {
  display: block;
  margin-top: 8rpx;
  color: #9ca3af;
  text-align: center;
  font-size: 22rpx;
}

.info-card .section-title {
  margin-bottom: 16rpx;
}

.info-row {
  min-height: 48rpx;
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  font-size: 23rpx;
  color: #bdbdbd;
}

.info-row text:last-child {
  color: #ffffff;
  text-align: right;
  word-break: break-all;
}

.error-card {
  border: 2rpx solid rgba(239, 68, 68, 0.42);
}

.error-title,
.error-msg {
  display: block;
}

.error-title {
  color: #ef4444;
  font-size: 28rpx;
  font-weight: 800;
}

.error-msg {
  margin-top: 8rpx;
  color: #d1d5db;
  font-size: 23rpx;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.primary-btn,
.secondary-btn,
.danger-btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
  font-weight: 800;
}

.primary-btn {
  background: #dc2626;
  color: #ffffff;
}

.secondary-btn {
  background: #2a2a2a;
  color: #ffffff;
}

.danger-btn {
  margin-top: 22rpx;
  background: #ef4444;
  color: #ffffff;
}

.primary-btn::after,
.secondary-btn::after,
.danger-btn::after {
  border: none;
}
</style>
