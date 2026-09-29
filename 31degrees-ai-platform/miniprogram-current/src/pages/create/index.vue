<template>
  <view class="laser-page">
    <view class="hero">
      <view>
        <text class="eyebrow">光学激光</text>
        <text class="page-title">照片生成加工文件</text>
        <text class="page-subtitle">内雕、打标、点阵和通用输出</text>
      </view>
      <view class="status-pill" :class="{ online: selectedMachine?.status === 'online' }">
        <text>{{ machineStatusText }}</text>
      </view>
    </view>

    <view class="steps">
      <view
        v-for="item in steps"
        :key="item.key"
        class="step"
        :class="{ active: activeStep === item.key, done: item.done }"
      >
        <text class="step-index">{{ item.index }}</text>
        <text class="step-label">{{ item.label }}</text>
      </view>
    </view>

    <view class="preview-board">
      <view class="preview-cell" @tap="chooseImage">
        <image v-if="localImage" :src="localImage" class="preview-image" mode="aspectFit" />
        <view v-else class="empty-upload">
          <text class="upload-mark">+</text>
          <text class="upload-title">上传照片</text>
          <text class="upload-hint">人像、产品图、Logo 均可</text>
        </view>
        <view class="preview-label">
          <text>原图</text>
        </view>
      </view>

      <view class="preview-cell result">
        <image v-if="resultUrl" :src="resultUrl" class="preview-image" mode="aspectFit" />
        <view v-else class="empty-upload">
          <text class="upload-mark thin">AI</text>
          <text class="upload-title">{{ processing ? '生成中' : '待生成' }}</text>
          <text class="upload-hint">{{ outputFormat }} 加工预览</text>
        </view>
        <view class="preview-label">
          <text>加工图</text>
        </view>
      </view>
    </view>

    <view class="action-row" v-if="localImage">
      <button class="ghost-btn" @tap.stop="chooseImage">更换照片</button>
      <button class="ghost-btn" @tap.stop="copyJobSummary">复制参数</button>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">设备</text>
        <text class="section-action" @tap="loadMachines">刷新</text>
      </view>
      <scroll-view scroll-x class="chip-scroll">
        <view class="chip-list">
          <view
            v-for="machine in machines"
            :key="machine.id"
            class="machine-chip"
            :class="{ active: selectedMachine?.id === machine.id, offline: machine.status !== 'online' }"
            @tap="selectMachine(machine)"
          >
            <text class="chip-main">{{ machine.name }}</text>
            <text class="chip-sub">{{ machine.machine_type }}</text>
            <text class="chip-state">{{ machine.status === 'online' ? '在线' : '离线' }}</text>
          </view>
          <view v-if="machines.length === 0" class="empty-chip">
            <text>暂无可用设备</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="section">
      <text class="section-title">材料和尺寸</text>
      <view class="grid-options">
        <view
          v-for="item in materials"
          :key="item.value"
          class="option-card"
          :class="{ active: material === item.value }"
          @tap="material = item.value"
        >
          <text class="option-title">{{ item.label }}</text>
          <text class="option-sub">{{ item.tip }}</text>
        </view>
      </view>
      <view class="size-row">
        <view
          v-for="item in sizes"
          :key="item.value"
          class="size-chip"
          :class="{ active: size === item.value }"
          @tap="size = item.value"
        >
          <text>{{ item.label }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">加工方式</text>
      <view class="process-list">
        <view
          v-for="item in processes"
          :key="item.value"
          class="process-item"
          :class="{ active: processType === item.value }"
          @tap="selectProcess(item.value)"
        >
          <view class="process-copy">
            <text class="process-name">{{ item.label }}</text>
            <text class="process-desc">{{ item.desc }}</text>
          </view>
          <text class="process-format">{{ item.format }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">加工参数</text>
      <view class="param-row">
        <text class="param-label">深度</text>
        <slider
          class="param-slider"
          :value="depthScale"
          min="50"
          max="300"
          block-size="18"
          activeColor="#e23a3d"
          @change="onDepthChange"
        />
        <text class="param-value">{{ (depthScale / 100).toFixed(1) }}</text>
      </view>
      <view class="param-row">
        <text class="param-label">平滑</text>
        <slider
          class="param-slider"
          :value="smoothRadius"
          min="0"
          max="20"
          block-size="18"
          activeColor="#e23a3d"
          @change="onSmoothChange"
        />
        <text class="param-value">{{ smoothRadius }}</text>
      </view>
      <view class="note-box">
        <input v-model="orderNote" maxlength="36" placeholder="订单备注，可填客户名或加工要求" />
      </view>
    </view>

    <view class="summary-panel">
      <view class="summary-row">
        <text>输出格式</text>
        <text>{{ outputFormat }}</text>
      </view>
      <view class="summary-row">
        <text>热文件夹文件名</text>
        <text>{{ hotFolderName }}</text>
      </view>
      <view class="summary-row">
        <text>预览状态</text>
        <text>{{ previewStatusText }}</text>
      </view>
    </view>

    <view class="bottom-bar">
      <button class="secondary-btn" :disabled="!localImage || processing" @tap="generatePreview">
        {{ processing ? '生成中' : '生成预览' }}
      </button>
      <button class="primary-btn" :disabled="!canSubmit || submitting" @tap="submitJob">
        {{ submitting ? '提交中' : '提交加工' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, getUploadUrl } from '@/api'
import { useMachineStore } from '@/stores/machine'
import { useUserStore } from '@/stores/user'

type Machine = {
  id: number
  name: string
  machine_type: string
  status: 'online' | 'offline' | 'maintenance'
  pending_orders?: number
}

const userStore = useUserStore()
const machineStore = useMachineStore()

const localImage = ref('')
const uploadedUrl = ref('')
const resultUrl = ref('')
const previewTaskId = ref<number | null>(null)
const machines = ref<Machine[]>([])
const selectedMachine = ref<Machine | null>(null)
const material = ref('crystal')
const size = ref('80x120')
const processType = ref('depth')
const depthScale = ref(120)
const smoothRadius = ref(5)
const orderNote = ref('')
const processing = ref(false)
const submitting = ref(false)

const materials = [
  { value: 'crystal', label: '水晶', tip: '内雕首选' },
  { value: 'acrylic', label: '亚克力', tip: '透明件' },
  { value: 'metal', label: '金属', tip: '打标' },
  { value: 'wood', label: '木质', tip: '浅雕刻' },
]

const sizes = [
  { value: '60x90', label: '60x90' },
  { value: '80x120', label: '80x120' },
  { value: '100x150', label: '100x150' },
  { value: 'custom', label: '自定义' },
]

const processes = [
  { value: 'depth', label: '2.5D 灰度图', desc: '照片转 8-bit 高度图', format: 'PNG' },
  { value: 'pod_3d', label: 'AI 内雕图', desc: '增强水晶内雕层次', format: 'PNG' },
  { value: 'halftone', label: '点阵打标', desc: '适合金属和皮革', format: 'PNG' },
  { value: 'gcode', label: 'G-code', desc: '通用控制器输出', format: 'GCODE' },
]

const outputFormat = computed(() => processes.find(item => item.value === processType.value)?.format || 'PNG')
const machineStatusText = computed(() => selectedMachine.value?.status === 'online' ? '设备在线' : '待选设备')
const previewStatusText = computed(() => {
  if (processing.value) return '生成中'
  if (previewTaskId.value) return `已生成 #${previewTaskId.value}`
  return '未生成'
})
const hotFolderName = computed(() => {
  const materialPart = material.value || 'material'
  const sizePart = size.value || 'custom'
  return `order_*_${processType.value}_${materialPart}_${sizePart}.${outputFormat.value.toLowerCase()}`
})

const activeStep = computed(() => {
  if (submitting.value) return 'submit'
  if (resultUrl.value) return 'preview'
  if (localImage.value) return 'params'
  return 'upload'
})

const steps = computed(() => [
  { key: 'upload', index: 1, label: '上传', done: !!localImage.value },
  { key: 'params', index: 2, label: '参数', done: !!localImage.value },
  { key: 'preview', index: 3, label: '预览', done: !!resultUrl.value },
  { key: 'submit', index: 4, label: '下单', done: false },
])

const canSubmit = computed(() =>
  !!localImage.value &&
  !!selectedMachine.value &&
  selectedMachine.value.status === 'online' &&
  !processing.value
)

onShow(() => {
  uni.showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  } as any)
  loadMachines()
})

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      localImage.value = res.tempFilePaths[0]
      uploadedUrl.value = ''
      resultUrl.value = ''
      previewTaskId.value = null
    },
  })
}

async function loadMachines() {
  try {
    const res = await api.machine.available()
    const list = res.machines || []
    machines.value = list.filter((item: Machine) => {
      const type = `${item.machine_type || ''} ${item.name || ''}`.toLowerCase()
      return type.includes('laser') || type.includes('engrave') || type.includes('mark') || type.includes('雕') || type.includes('激光')
    })
    selectedMachine.value = machines.value.find(item => item.status === 'online') || machines.value[0] || null
  } catch {
    machines.value = []
    selectedMachine.value = null
  }
}

function selectMachine(machine: Machine) {
  selectedMachine.value = machine
}

function selectProcess(value: string) {
  processType.value = value
  resultUrl.value = ''
  previewTaskId.value = null
}

function onDepthChange(e: any) {
  depthScale.value = Number(e.detail.value || 120)
}

function onSmoothChange(e: any) {
  smoothRadius.value = Number(e.detail.value || 5)
}

async function ensureLogin() {
  userStore.restoreLogin()
  if (userStore.isLogin) return
  const loginRes: any = await uni.login()
  if (!loginRes.code) throw new Error('未获取到登录凭证')
  await userStore.wxLogin(loginRes.code)
}

async function ensureUploaded() {
  await ensureLogin()
  if (uploadedUrl.value) return uploadedUrl.value
  if (!localImage.value) throw new Error('请先上传照片')
  uploadedUrl.value = await uploadImage(localImage.value)
  return uploadedUrl.value
}

async function generatePreview() {
  if (!localImage.value) {
    uni.showToast({ title: '请先上传照片', icon: 'none' })
    return
  }

  processing.value = true
  resultUrl.value = ''
  previewTaskId.value = null
  uni.showLoading({ title: '生成预览...' })
  try {
    const imageUrl = await ensureUploaded()
    if (processType.value === 'pod_3d') {
      const res: any = await api.processing.pod3d(
        imageUrl,
        depthScale.value / 100,
        45,
        smoothRadius.value,
        32,
      )
      resultUrl.value = res.output_url || ''
      previewTaskId.value = res.task_id || null
    } else if (processType.value === 'halftone') {
      const depth: any = await api.processing.depthMap(imageUrl)
      const res: any = await api.processing.halftone(depth.depth_url || imageUrl, 'floyd-steinberg', 1, 128)
      resultUrl.value = res.halftone_url || ''
      previewTaskId.value = res.task_id || depth.task_id || null
    } else if (processType.value === 'gcode') {
      const res: any = await api.processing.gcode(imageUrl, 'raster')
      resultUrl.value = localImage.value
      previewTaskId.value = res.task_id || null
      uni.showToast({ title: 'G-code 已生成', icon: 'success' })
    } else {
      const res: any = await api.processing.depthMap(imageUrl)
      resultUrl.value = res.depth_url || ''
      previewTaskId.value = res.task_id || null
    }
    if (!resultUrl.value) resultUrl.value = localImage.value
  } catch (e: any) {
    resultUrl.value = localImage.value
    uni.showToast({ title: e?.message || '预览失败，已保留原图', icon: 'none' })
  } finally {
    uni.hideLoading()
    processing.value = false
  }
}

async function submitJob() {
  if (!selectedMachine.value) {
    uni.showToast({ title: '请选择设备', icon: 'none' })
    return
  }
  if (selectedMachine.value.status !== 'online') {
    uni.showToast({ title: '设备离线，请先启动 PC 接收端', icon: 'none' })
    return
  }

  submitting.value = true
  uni.showLoading({ title: '提交加工...' })
  try {
    const imageUrl = await ensureUploaded()
    const params = {
      workflow: 'laser_mvp',
      material: material.value,
      size: size.value,
      process_type: processType.value,
      output_format: outputFormat.value,
      depth_scale: depthScale.value / 100,
      smooth_radius: smoothRadius.value,
      preview_task_id: previewTaskId.value,
      source: 'mini-program',
    }

    const res: any = await machineStore.createOrder({
      machine_id: selectedMachine.value.id,
      source_image_url: imageUrl,
      ai_processing_type: processType.value,
      material_type: material.value,
      gift_message: orderNote.value || undefined,
      engraving_params: params,
      deduction_mode: 'self',
    })

    uni.navigateTo({ url: `/pages/machine/status?id=${res.order_id}` })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    submitting.value = false
  }
}

function uploadImage(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: getUploadUrl(),
      filePath,
      name: 'file',
      header: userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {},
      success: (res: any) => {
        try {
          const data = JSON.parse(res.data)
          if (data.url) resolve(data.url)
          else reject(new Error(data.error || '上传失败'))
        } catch (e) {
          reject(e)
        }
      },
      fail: reject,
    })
  })
}

function copyJobSummary() {
  const summary = [
    '31度光学激光加工',
    `材料：${material.value}`,
    `尺寸：${size.value}`,
    `工艺：${processType.value}`,
    `输出：${outputFormat.value}`,
    `深度：${(depthScale.value / 100).toFixed(1)}`,
    `平滑：${smoothRadius.value}`,
  ].join('\n')
  uni.setClipboardData({
    data: summary,
    success() {
      uni.showToast({ title: '参数已复制', icon: 'success' })
    },
  })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度光学激光定制',
      path: '/pages/create/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度光学激光定制',
    }
  },
  onCopyUrl() {
    return {
      query: '',
    }
  },
}
</script>

<style lang="scss" scoped>
.laser-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24rpx 24rpx 152rpx;
  background: #111111;
  color: #ffffff;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 12rpx 4rpx 24rpx;
}

.eyebrow,
.page-title,
.page-subtitle {
  display: block;
}

.eyebrow {
  color: #ef4444;
  font-size: 22rpx;
  font-weight: 700;
}

.page-title {
  margin-top: 4rpx;
  font-size: 40rpx;
  line-height: 52rpx;
  font-weight: 800;
}

.page-subtitle {
  margin-top: 4rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.status-pill {
  flex: 0 0 auto;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #b6b6b6;
  font-size: 22rpx;
}

.status-pill.online {
  background: rgba(34, 197, 94, 0.14);
  color: #4ade80;
}

.steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
  margin-bottom: 20rpx;
}

.step {
  min-width: 0;
  height: 58rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 10rpx;
  background: #1b1b1b;
  color: #777777;
}

.step.active,
.step.done {
  background: #2a1718;
  color: #ffffff;
}

.step-index {
  width: 28rpx;
  height: 28rpx;
  line-height: 28rpx;
  text-align: center;
  border-radius: 50%;
  background: #333333;
  font-size: 18rpx;
}

.step.active .step-index,
.step.done .step-index {
  background: #dc2626;
}

.step-label {
  font-size: 20rpx;
}

.preview-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.preview-cell {
  position: relative;
  height: 336rpx;
  border-radius: 12rpx;
  background: #191919;
  border: 2rpx dashed rgba(220, 38, 38, 0.32);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-cell.result {
  border-style: solid;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.empty-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 0 20rpx;
  text-align: center;
}

.upload-mark {
  font-size: 64rpx;
  line-height: 72rpx;
  color: #ef4444;
  font-weight: 700;
}

.upload-mark.thin {
  font-size: 38rpx;
}

.upload-title {
  font-size: 28rpx;
  font-weight: 800;
}

.upload-hint {
  font-size: 21rpx;
  color: #858585;
}

.preview-label {
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.58);
  color: #ffffff;
  font-size: 20rpx;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 16rpx;
}

.section,
.summary-panel {
  margin-top: 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.section-title {
  display: block;
  margin-bottom: 14rpx;
  font-size: 28rpx;
  font-weight: 800;
}

.section-head .section-title {
  margin-bottom: 0;
}

.section-action {
  color: #ef4444;
  font-size: 22rpx;
}

.chip-scroll {
  width: 100%;
  white-space: nowrap;
}

.chip-list {
  display: inline-flex;
  gap: 12rpx;
}

.machine-chip,
.empty-chip {
  min-width: 286rpx;
  box-sizing: border-box;
  padding: 18rpx;
  border-radius: 12rpx;
  background: #191919;
  border: 2rpx solid transparent;
}

.machine-chip.active {
  border-color: #dc2626;
  background: #241516;
}

.machine-chip.offline {
  opacity: 0.58;
}

.chip-main,
.chip-sub,
.chip-state {
  display: block;
}

.chip-main {
  font-size: 24rpx;
  font-weight: 800;
}

.chip-sub {
  margin-top: 6rpx;
  color: #8d8d8d;
  font-size: 20rpx;
}

.chip-state {
  margin-top: 8rpx;
  color: #4ade80;
  font-size: 20rpx;
}

.machine-chip.offline .chip-state {
  color: #9ca3af;
}

.empty-chip {
  color: #8d8d8d;
  font-size: 22rpx;
}

.grid-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.option-card {
  min-height: 106rpx;
  box-sizing: border-box;
  padding: 18rpx;
  border-radius: 12rpx;
  background: #191919;
  border: 2rpx solid transparent;
}

.option-card.active {
  border-color: #dc2626;
  background: #241516;
}

.option-title,
.option-sub {
  display: block;
}

.option-title {
  font-size: 26rpx;
  font-weight: 800;
}

.option-sub {
  margin-top: 6rpx;
  color: #888888;
  font-size: 21rpx;
}

.size-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.size-chip {
  height: 58rpx;
  line-height: 58rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #191919;
  color: #bdbdbd;
  font-size: 22rpx;
}

.size-chip.active {
  background: #dc2626;
  color: #ffffff;
}

.process-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.process-item {
  min-height: 92rpx;
  box-sizing: border-box;
  padding: 16rpx 18rpx;
  border-radius: 12rpx;
  background: #191919;
  border: 2rpx solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.process-item.active {
  border-color: #dc2626;
  background: #241516;
}

.process-copy {
  min-width: 0;
}

.process-name,
.process-desc {
  display: block;
}

.process-name {
  font-size: 25rpx;
  font-weight: 800;
}

.process-desc {
  margin-top: 5rpx;
  color: #898989;
  font-size: 21rpx;
}

.process-format {
  flex: 0 0 auto;
  color: #f97316;
  font-size: 21rpx;
  font-weight: 800;
}

.param-row {
  height: 72rpx;
  display: grid;
  grid-template-columns: 88rpx 1fr 70rpx;
  align-items: center;
  gap: 12rpx;
  padding: 0 18rpx;
  border-radius: 12rpx;
  background: #191919;
  margin-bottom: 12rpx;
}

.param-label,
.param-value {
  font-size: 22rpx;
  color: #bdbdbd;
}

.param-value {
  text-align: right;
  color: #ffffff;
  font-weight: 800;
}

.param-slider {
  width: 100%;
}

.note-box {
  height: 76rpx;
  padding: 0 18rpx;
  border-radius: 12rpx;
  background: #191919;
  display: flex;
  align-items: center;
}

.note-box input {
  width: 100%;
  color: #ffffff;
  font-size: 24rpx;
}

.summary-panel {
  padding: 18rpx;
  border-radius: 12rpx;
  background: #191919;
}

.summary-row {
  min-height: 46rpx;
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  font-size: 22rpx;
  color: #bdbdbd;
}

.summary-row text:last-child {
  color: #ffffff;
  text-align: right;
  word-break: break-all;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 24rpx 28rpx;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 16rpx;
  background: rgba(12, 12, 12, 0.97);
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}

.primary-btn,
.secondary-btn,
.ghost-btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
  font-weight: 800;
}

.primary-btn {
  color: #ffffff;
  background: #dc2626;
}

.secondary-btn {
  color: #ffffff;
  background: #2a2a2a;
}

.ghost-btn {
  color: #ffffff;
  background: #171717;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
}

.primary-btn[disabled],
.secondary-btn[disabled] {
  opacity: 0.45;
}

.primary-btn::after,
.secondary-btn::after,
.ghost-btn::after {
  border: none;
}
</style>
