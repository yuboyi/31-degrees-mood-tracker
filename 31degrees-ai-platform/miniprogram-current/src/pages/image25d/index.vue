<template>
  <view class="image-page">
    <!-- 顶部标题区 + 状态徽标 -->
    <view class="hero">
      <view class="hero-orb orb-a"></view>
      <view class="hero-orb orb-b"></view>
      <view class="hero-copy">
        <text class="eyebrow">31度激光内雕</text>
        <text class="title">生成内雕图片</text>
        <text class="subtitle">上传照片，查看灰度 / 2.5D 预览，生成 BMP / PNG 交给门店电脑。</text>
      </view>
      <text class="status-pill">{{ statusText }}</text>
    </view>

    <view class="body">
      <!-- 流程步骤 -->
      <view class="flow-strip">
        <view v-for="item in steps" :key="item.label" class="flow-step" :class="{ active: item.active, done: item.done }">
          <text class="step-no">{{ item.index }}</text>
          <text class="step-text">{{ item.label }}</text>
        </view>
      </view>

      <!-- 上传大卡 -->
      <view class="upload-card" @tap="chooseImage">
        <image v-if="localImage" class="upload-image" :src="localImage" mode="aspectFit" />
        <view v-else class="upload-empty">
          <text class="upload-plus">+</text>
          <text class="upload-title">上传图片</text>
          <text class="upload-desc">照片或已制好的灰度图 · 最大10M · png/jpg/bmp</text>
        </view>
      </view>

      <!-- 是否需要优化 -->
      <view class="card">
        <text class="title-text">图片来源</text>
        <view class="segment">
          <view class="segment-item" :class="{ selected: sourceKind === 'photo' }" @tap="selectSourceKind('photo')"><text>普通照片生成深度</text></view>
          <view class="segment-item" :class="{ selected: sourceKind === 'gray' }" @tap="selectSourceKind('gray')"><text>已有灰度图直接交付</text></view>
        </view>
        <text v-if="sourceKind === 'gray'" class="panel-note">保留灰阶和尺寸，不抠图、不增强、不反相、不重新生成深度。彩色照片或透明背景会提示修正。</text>
        <template v-if="sourceKind === 'photo'">
        <view class="section-title">
          <view class="title-bar red"></view>
          <text class="title-text">是否需要优化</text>
        </view>
        <text class="panel-note">对原始图不满意时先AI优化，再转2.5D</text>
        <view class="segment">
          <view class="segment-item" :class="{ selected: !needOptimize }" @tap="setOptimize(false)">
            <text>不需要</text>
          </view>
          <view class="segment-item" :class="{ selected: needOptimize }" @tap="setOptimize(true)">
            <text>需要</text>
          </view>
        </view>
        <image v-if="optimizedUrl" class="optimize-preview" :src="optimizedUrl" mode="aspectFit" />
        <text v-if="optimizedUrl" class="optimize-note">已生成AI优化图（画质增强），后续预检与2.5D均基于优化图，原始图保留。</text>
        <text v-if="!optimizedUrl && needOptimize" class="optimize-note dim">生成图片时先增强原图画质，再进入预检和2.5D转换。</text>
        </template>
      </view>

      <view v-if="showAdvanced" class="card capability-card">
        <view class="section-title">
          <view class="title-bar red"></view>
          <text class="title-text">现场应用</text>
        </view>
        <view class="option-block">
          <text class="option-label">制作场景</text>
          <view class="chip-grid">
            <view v-for="item in applicationModes" :key="item.value" class="option-chip"
              :class="{ selected: applicationMode === item.value }" @tap="selectApplicationMode(item.value)">
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>
        <view class="option-block">
          <text class="option-label">激光器方案</text>
          <view class="chip-grid">
            <view v-for="item in laserSources" :key="item.value" class="option-chip"
              :class="{ selected: laserSource === item.value }" @tap="selectLaserSource(item.value)">
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>
        <view class="option-block">
          <text class="option-label">交付文件</text>
          <view class="chip-grid">
            <view v-for="item in deliveryFormats" :key="item.value" class="option-chip"
              :class="{ selected: deliveryFormat === item.value }" @tap="selectDeliveryFormat(item.value)">
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>
        <text class="capability-note">交付 BMP 或 PNG 图片到门店电脑文件夹；本流程不生成机器指令，也不启动打印或雕刻。</text>
      </view>

      <!-- 材料 / 尺寸 / 工艺 -->
      <view class="card">
        <view class="section-title">
          <view class="title-bar red"></view>
          <text class="title-text">加工参数</text>
          <text class="panel-note">材料 · 尺寸 · 工艺</text>
        </view>

        <view class="option-block">
          <text class="option-label">材料</text>
          <view class="chip-grid">
            <view
              v-for="item in materialOptions"
              :key="item"
              class="option-chip"
              :class="{ selected: material === item }"
              @tap="selectMaterial(item)"
            >
              <text>{{ item }}</text>
            </view>
          </view>
        </view>

        <view class="option-block">
          <text class="option-label">尺寸</text>
          <view class="chip-grid">
            <view
              v-for="item in sizeOptions"
              :key="item"
              class="option-chip"
              :class="{ selected: sizeText === item }"
              @tap="selectSize(item)"
            >
              <text>{{ item }}</text>
            </view>
          </view>
        </view>

        <view class="option-block">
          <text class="option-label">工艺</text>
          <view class="chip-grid">
            <view
              v-for="item in craftOptions"
              :key="item"
              class="option-chip"
              :class="{ selected: craftProcess === item }"
              @tap="selectCraft(item)"
            >
              <text>{{ item }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 主按钮 -->
      <button class="generate-btn" :disabled="running" @tap="runOneClick">
        {{ generateButtonText }}
      </button>

      <!-- 处理进度 / 状态 -->
      <view class="card status-card" :class="{ warn: usingLocalPreviewPackage || !!lastError }">
        <view class="status-head">
          <text class="status-stage">{{ currentStage }}</text>
          <text class="status-percent">{{ running ? `${progress}%` : packageReady ? '完成' : localImage ? '待生成' : '等待' }}</text>
        </view>
        <view class="progress-track">
          <view class="progress-bar" :style="{ width: `${progress}%` }" />
        </view>
        <text class="status-desc">{{ runtimeNotice || '上传图片后生成 PNG/BMP；生成失败会保留原图并提示错误，不用测试文件冒充真实结果。' }}</text>
        <text v-if="usingLocalPreviewPackage" class="status-warning">本机测试预览不能作为正式交付图片。</text>
        <text v-if="lastError" class="status-error">{{ lastError }}</text>
      </view>

      <view class="card runtime-card">
        <view class="section-title">
          <view class="title-bar red"></view>
          <text class="title-text">本次运行工作流</text>
          <text class="panel-note">实际调用记录</text>
        </view>
        <text v-if="workflowTools.length" class="runtime-line">{{ workflowTools.join(' → ') }}</text>
        <text v-else class="runtime-line">上传后才启动预检、灰度、BMP转换和2.5D预览工具</text>
        <text class="runtime-note">只展示实际接口返回的图片；生成失败保留错误，预览失败单独提示，不生成替代测试包。</text>
      </view>

      <!-- 效果预览：同一张图切换原图、灰度和2.5D结果，避免只看文件名做判断 -->
      <view class="card effect-preview-card">
        <view class="section-title">
          <view class="title-bar red"></view>
          <text class="title-text">效果预览</text>
          <text class="panel-note">上传后可切换</text>
        </view>
        <view class="preview-tabs">
          <view v-for="item in previewTabs" :key="item.key" class="preview-tab"
            :class="{ active: previewMode === item.key, disabled: !item.url }"
            @tap="selectPreview(item.key)">
            <text>{{ item.label }}</text>
          </view>
        </view>
        <view class="effect-preview-stage" :class="{ depth: previewMode === 'gray' || previewMode === '25d' }">
          <image v-if="previewImageUrl" class="effect-preview-image" :src="previewImageUrl" mode="aspectFit" />
          <view v-else class="effect-preview-empty">
            <text class="empty-icon">◌</text>
            <text>上传照片后显示灰度和2.5D效果</text>
          </view>
        </view>
        <text class="effect-preview-label">{{ previewLabel }}</text>
        <text class="effect-preview-note">效果图用于确认构图、层次和风险，不等于已生成可直接上机的正式设备文件。</text>
      </view>

      <!-- 工艺预检报告卡 -->
      <view class="card report-card" :class="craftToneClass">
        <view class="section-title">
          <view class="title-bar red"></view>
          <text class="title-text">加工预检报告</text>
          <text class="panel-note">{{ craftBadgeText || '待预检' }}</text>
        </view>

        <template v-if="craftAssessment">
          <view class="risk-head">
            <view class="risk-score">
              <text class="risk-score-num">{{ craftAssessment.risk_score }}</text>
              <text class="risk-score-total">/100</text>
            </view>
            <text class="report-badge" :class="craftAssessment.manual_review_required ? 'block' : 'pass'">
              {{ craftAssessment.manual_review_required ? '拦截' : '通过' }}
            </text>
          </view>
          <text class="risk-subtitle">{{ craftAssessment.recommended_process || craftProcess }}</text>

          <image v-if="craftRiskImage" class="risk-image" :src="craftRiskImage" mode="aspectFit" />

          <view class="metric-grid">
            <view v-for="item in craftMetricCards" :key="item.label" class="metric-item">
              <text class="metric-label">{{ item.label }}</text>
              <text class="metric-value">{{ item.value }}</text>
            </view>
          </view>

          <view class="risk-list">
            <view v-for="item in craftRiskItems" :key="item.code" class="risk-item" :class="item.severity">
              <text class="risk-item-title">{{ item.label }}</text>
              <text class="risk-item-advice">{{ item.advice }}</text>
            </view>
          </view>

          <text v-if="craftAssessment.manual_review_required" class="manual-review-tip">
            此图案会进入人工复核，不直接下发设备；先优化细线/起伏可减少返工。
          </text>
          <text v-if="craftStore.error" class="craft-fallback">接口异常，当前结论来自本机保守规则：{{ craftStore.error }}</text>
        </template>
        <view v-else class="craft-empty">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">{{ sourceKind === 'gray' ? '已有灰度图只校验格式与灰阶，不推断雕刻深度或给出设备加工结论。' : '上传图片后先做工艺预检，判断细线密度、灰度层次和局部起伏，再生成交付图片。' }}</text>
        </view>
      </view>

      <!-- 加工文件输出卡 -->
      <view class="card output-card">
        <view class="section-title">
          <view class="title-bar red"></view>
          <text class="title-text">加工文件输出</text>
          <text class="panel-note">{{ packageReady ? (usingLocalPreviewPackage ? '测试预览包' : '已生成') : '待生成' }}</text>
        </view>

        <view class="output-list">
          <view v-for="item in visibleOutputs" :key="item.key" class="output-item" :class="{ ready: item.ready }" @tap="openOutput(item)">
            <view class="output-icon">📄</view>
            <text class="output-name">{{ item.name }}</text>
            <view class="output-dot" :class="{ on: item.ready }"></view>
          </view>
        </view>

        <view class="machine-note">
          <text>{{ packageReady ? '所选图片已生成；自动同步门店文件夹尚未接通，不代表已保存到门店电脑。后续打印或雕刻由现场软件处理。' : '生成 BMP / PNG 图片后交给门店电脑；不要求生成 STL、G-code 或设备任务包。' }}</text>
        </view>
      </view>

      <view class="advanced-toggle" @tap="showAdvanced = !showAdvanced">
        <text>{{ showAdvanced ? '收起高级参数与交付说明' : '更多参数与交付说明' }}</text>
        <text class="toggle-arrow">{{ showAdvanced ? '⌃' : '⌄' }}</text>
      </view>

      <!-- Z轴参数 / PC交付 信息卡 -->
      <view v-if="showAdvanced" class="card info-card">
        <view class="section-title">
          <view class="title-bar red"></view>
          <text class="title-text">图片文件 · PC交付</text>
        </view>
        <view class="info-grid">
          <view class="info-item"><text class="info-key">喷墨图片</text><text class="info-val">PNG</text></view>
          <view class="info-item"><text class="info-key">内雕图片</text><text class="info-val">BMP / PNG</text></view>
          <view class="info-item"><text class="info-key">交付位置</text><text class="info-val">门店指定文件夹</text></view>
          <view class="info-item"><text class="info-key">PC客户端</text><text class="info-val">接收方式待核验</text></view>
        </view>
        <view class="delivery-flow">
          <view class="delivery-step"><text class="delivery-num">1</text><text class="delivery-text">生成图片</text></view>
          <view class="delivery-step"><text class="delivery-num">2</text><text class="delivery-text">确认效果</text></view>
          <view class="delivery-step"><text class="delivery-num">3</text><text class="delivery-text">电脑接收</text></view>
          <view class="delivery-step"><text class="delivery-num">4</text><text class="delivery-text">文件落盘</text></view>
        </view>
        <text class="info-tip">本软件的交付终点是图片成功保存到对应门店电脑文件夹，不是机器加工完成。自动落盘仍待接通与回读验证。</text>
      </view>

      <!-- 底部操作按钮组 -->
      <view class="action-row">
        <button class="ghost-btn" :disabled="!packageReady" @tap="saveWork">保存作品</button>
        <button class="ghost-btn primary" :disabled="!canSubmitSample" @tap="submitSample">提交打样</button>
        <button class="ghost-btn" :disabled="!packageReady" @tap="copyDeliveryInfo">复制文件信息</button>
        <button class="ghost-btn" open-type="contact" @tap="contactFallback">联系客服</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, getApiBaseUrl, getUploadUrl } from '@/api'
import { useUserStore } from '@/stores/user'
import { useCraftStore } from '@/stores/craft'
import { useAgentHandoffStore } from '@/stores/agentHandoff'
import { generateLaserImages, laserImagesReady, validateRasterDownload, rasterUploadExtension } from '@/utils/laserImageDelivery.mjs'

type OutputItem = {
  key: string
  name: string
  url: string
  ready: boolean
}

const userStore = useUserStore()
const craftStore = useCraftStore()
const localImage = ref('')
const uploadedUrl = ref('')
const maskUrl = ref('')
const depthUrl = ref('')
const bmpUrl = ref('')
const pod3dUrl = ref('')
const gcodeUrl = ref('')
const zGcodeUrl = ref('')
const stlUrl = ref('')
const profileUrl = ref('')
const guideUrl = ref('')
const zMoves = ref(0)
const stlTriangles = ref(0)
const machineProfile = ref<any>(null)
const gcodeLines = ref(0)
const taskId = ref<number | null>(null)
const depthStats = ref<any>(null)
const lastError = ref('')
const running = ref(false)
const progress = ref(0)
const currentStage = ref('等待上传图片')
const runtimeNotice = ref('')
const usingLocalPreviewPackage = ref(false)
const processingFallbackReason = ref('')
const material = ref('水晶')
const sizeText = ref('80x80x80mm')
const craftProcess = ref('内雕灰度图')
const needOptimize = ref(false)
const sourceKind = ref<'photo' | 'gray'>('photo')
const optimizedUrl = ref('')
const applicationMode = ref('workbench')
const laserSource = ref('uv')
const deliveryFormat = ref('both')
const capabilityProfile = ref<any>(null)
const showAdvanced = ref(false)
const previewMode = ref<'original' | 'gray' | '25d' | 'risk'>('original')
const workflowTools = ref<string[]>([])

const applicationModes = computed(() => capabilityProfile.value?.application_modes || [
  { value: 'vending_diy', label: '自动售卖机现场DIY' },
  { value: 'workbench', label: '门店工作台制作' },
])
const laserSources = computed(() => capabilityProfile.value?.laser_sources || [
  { value: 'uv', label: '紫外激光器' },
  { value: 'green', label: '绿光激光器' },
])
const deliveryFormats = [
  { value: 'both', label: 'BMP + PNG' },
  { value: 'bmp', label: 'BMP 灰度图' },
  { value: 'png', label: 'PNG 灰度图' },
]
const requestedFormats = computed(() => deliveryFormat.value === 'both'
  ? ['BMP', 'PNG'] : [deliveryFormat.value.toUpperCase()])

const materialOptions = ['水晶', '亚克力', '金属', '木质', '皮革', '玻璃']
const sizeOptions = ['50x50x50mm', '80x80x80mm', '100x100x50mm', 'A5', 'A4']
const craftOptions = ['内雕灰度图', '2.5D浮雕预览', '线稿打标', '烫金线稿', '人工复核']

const packageReady = computed(() => laserImagesReady(deliveryFormat.value, depthUrl.value, bmpUrl.value, usingLocalPreviewPackage.value))
const craftAssessment = computed(() => craftStore.result)
const craftRiskItems = computed(() => craftAssessment.value?.risk_items || [])
const craftToneClass = computed(() => `tone-${craftStore.riskTone}`)
const craftBadgeText = computed(() => craftStore.riskLevelText)
const craftRiskImage = computed(() => normalizeAssetUrl(craftAssessment.value?.risk_image_url || ''))
const canSubmitSample = computed(() => packageReady.value && !!craftAssessment.value)
const craftMetricCards = computed(() => {
  const metrics = craftAssessment.value?.metrics || {}
  return [
    { label: '线条密度', value: formatPercent(metrics.edge_density) },
    { label: '陡峭起伏', value: formatPercent(metrics.high_edge_ratio) },
    { label: '最小线宽', value: formatMm(metrics.estimated_min_line_mm) },
    { label: '灰度反差', value: String(metrics.contrast ?? '-') },
  ]
})
const statusText = computed(() => {
  if (running.value) return sourceKind.value === 'gray' ? '灰度图处理中' : 'AI生成中'
  if (craftAssessment.value?.manual_review_required) return '需人工复核'
  if (packageReady.value) return '图片已生成'
  if (craftAssessment.value) return '预检完成'
  if (localImage.value) return '图片已选择'
  return '待上传图片'
})
const generateButtonText = computed(() => {
  if (running.value) return `正在生成 ${progress.value}%`
  if (!localImage.value) return '上传图片'
  return packageReady.value ? '重新生成内雕图片' : '预检并生成内雕图片'
})

const steps = computed(() => [
  { index: '1', label: '上传', done: !!localImage.value, active: !localImage.value },
  { index: '2', label: '预检', done: !!craftAssessment.value, active: running.value && progress.value < 30 },
  { index: '3', label: '图片', done: packageReady.value, active: running.value && progress.value >= 30 },
  { index: '4', label: '交付', done: false, active: packageReady.value },
])

const outputs = computed<OutputItem[]>(() => [
  { key: 'assess', name: '工艺预检报告JSON', url: craftAssessment.value?.report_url || '', ready: !!craftAssessment.value?.report_url },
  { key: 'risk', name: '风险热区图', url: craftRiskImage.value, ready: !!craftRiskImage.value },
  { key: 'depth', name: 'PNG灰度图', url: depthUrl.value, ready: !!depthUrl.value },
  { key: 'bmp', name: 'BMP灰度位图', url: bmpUrl.value, ready: !!bmpUrl.value },
  { key: 'pod3d', name: '2.5D预览图', url: pod3dUrl.value, ready: !!pod3dUrl.value },
  { key: 'profile', name: '现场软件参数JSON', url: profileUrl.value, ready: !!profileUrl.value },
  { key: 'zgcode', name: 'Z轴2.5D G-code', url: zGcodeUrl.value, ready: !!zGcodeUrl.value },
  { key: 'stl', name: 'STL高度模型候选', url: stlUrl.value, ready: !!stlUrl.value },
  { key: 'guide', name: '导入说明TXT', url: guideUrl.value, ready: !!guideUrl.value },
  { key: 'gcode', name: '普通栅格G-code', url: gcodeUrl.value, ready: !!gcodeUrl.value },
])
const visibleOutputs = computed(() => {
  const coreKeys = new Set(['depth', 'bmp', 'pod3d'])
  return outputs.value.filter(item => {
    if (['zgcode', 'gcode', 'stl', 'profile', 'guide'].includes(item.key)) return false
    if (!showAdvanced.value && !coreKeys.has(item.key)) return false
    return deliveryFormat.value !== 'png' || item.key !== 'bmp'
  })
})
const previewTabs = computed(() => [
  { key: 'original', label: '原图', url: localImage.value },
  { key: 'gray', label: '灰度图', url: depthUrl.value },
  { key: '25d', label: '2.5D', url: pod3dUrl.value },
  { key: 'risk', label: '风险图', url: craftRiskImage.value },
])
const previewImageUrl = computed(() => previewTabs.value.find((item) => item.key === previewMode.value)?.url || '')
const previewLabel = computed(() => {
  const item = previewTabs.value.find((candidate) => candidate.key === previewMode.value)
  return item?.url ? `${item.label}已生成` : `${item?.label || '效果'}等待生成`
})

function formatPercent(value: any) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  return `${Math.round(number * 100)}%`
}

function formatMm(value: any) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  return `${number.toFixed(number < 0.1 ? 3 : 2)}mm`
}

function selectPreview(mode: 'original' | 'gray' | '25d' | 'risk') {
  const item = previewTabs.value.find((candidate) => candidate.key === mode)
  if (!item?.url) {
    uni.showToast({ title: '该效果还未生成', icon: 'none' })
    return
  }
  previewMode.value = mode
}

onShow(() => {
  uni.showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  } as any)
  consumeAgentHandoff()
  loadCapabilityProfile()
})

async function loadCapabilityProfile() {
  if (capabilityProfile.value) return
  try {
    capabilityProfile.value = await api.capabilities.rkq()
  } catch {
    capabilityProfile.value = null
  }
}

function consumeAgentHandoff() {
  try {
    const store = useAgentHandoffStore()
    if (!store.hasHandoff || !store.payload) return
    const p: any = store.payload
    if (p.source_url) localImage.value = normalizeAssetUrl(p.source_url)
    if (p.styled_url) {
      const styled = normalizeAssetUrl(p.styled_url)
      localImage.value = styled
      uploadedUrl.value = styled
      optimizedUrl.value = styled
    }
    if (p.depth_url) depthUrl.value = normalizeAssetUrl(p.depth_url)
    if (p.pod3d_url) pod3dUrl.value = normalizeAssetUrl(p.pod3d_url)
    if (p.bmp_url) bmpUrl.value = normalizeAssetUrl(p.bmp_url)
    if (p.z_gcode_url) zGcodeUrl.value = normalizeAssetUrl(p.z_gcode_url)
    if (p.stl_url) stlUrl.value = normalizeAssetUrl(p.stl_url)
    if (p.profile_url) profileUrl.value = normalizeAssetUrl(p.profile_url)
    if (p.material) material.value = String(p.material)
    if (p.sizeText) sizeText.value = String(p.sizeText)
    if (typeof p.optimize === 'boolean') needOptimize.value = p.optimize
    runtimeNotice.value = '已载入AI照片定制结果，可继续工艺预检并提交打样。'
    store.consumeHandoff()
  } catch {
    // 忽略异常，不影响页面正常使用
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function markProgress(value: number) {
  progress.value = value
  await sleep(120)
}

function toErrorMessage(error: any, fallback = '接口不可用') {
  if (!error) return fallback
  if (typeof error === 'string') return error
  return error.message || error.errMsg || fallback
}


function syncCraftOptions() {
  craftStore.setWorkOptions({
    material: material.value,
    process: craftProcess.value,
    sizeText: sizeText.value,
    machineType: '激光内雕机',
  })
}

function resetAssessmentForOptionChange() {
  resetOutputs()
  syncCraftOptions()
}

function capabilityMetadata() {
  return {
    capability_profile_id: capabilityProfile.value?.profile_id || 'rkq-vending-laser-20260920',
    application_mode: applicationMode.value,
    laser_source: laserSource.value,
    requested_formats: requestedFormats.value,
    integration_status: 'vendor-page-observed',
  }
}

function selectMaterial(value: string) {
  if (running.value) return
  material.value = value
  resetAssessmentForOptionChange()
}

function selectSourceKind(value: 'photo' | 'gray') {
  if (running.value || sourceKind.value === value) return
  sourceKind.value = value
  needOptimize.value = false
  resetOutputs()
}

function selectSize(value: string) {
  if (running.value) return
  sizeText.value = value
  resetAssessmentForOptionChange()
}

function selectCraft(value: string) {
  if (running.value) return
  craftProcess.value = value
  resetAssessmentForOptionChange()
}

function selectApplicationMode(value: string) {
  if (running.value) return
  applicationMode.value = value
  resetAssessmentForOptionChange()
}

function selectLaserSource(value: string) {
  if (running.value) return
  laserSource.value = value
  resetAssessmentForOptionChange()
}

function selectDeliveryFormat(value: string) {
  if (running.value) return
  deliveryFormat.value = value
  resetAssessmentForOptionChange()
}

function setOptimize(value: boolean) {
  if (running.value) return
  resetOutputs()
  needOptimize.value = value
  if (!value) optimizedUrl.value = ''
  currentStage.value = value ? '已开启AI优化' : '已关闭AI优化'
  runtimeNotice.value = value ? '生成图片时先增强原图画质，再预检和转2.5D。' : '直接使用原始图做预检和2.5D转换。'
}

function chooseImage() {
  if (running.value) return
  uni.chooseImage({
    count: 1,
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success(res: any) {
      const file = res.tempFiles?.[0]
      const size = file?.size || 0
      const path = (res.tempFilePaths?.[0] || '') as string
      const ext = rasterUploadExtension(file, path)
      if (!['png', 'jpg', 'jpeg', 'bmp'].includes(ext)) {
        uni.showToast({ title: '仅支持png、jpg、bmp格式', icon: 'none' })
        return
      }
      if (size > 10 * 1024 * 1024) {
        uni.showToast({ title: '图片请控制在10M以内', icon: 'none' })
        return
      }
      localImage.value = res.tempFilePaths[0]
      resetOutputs()
      currentStage.value = '图片已选择'
      runtimeNotice.value = '已收到图片，正在自动开始工艺预检。'
      uni.showToast({ title: '已选择图片，开始预检', icon: 'none' })
      setTimeout(() => {
        if (localImage.value && !running.value) runOneClick()
      }, 120)
    },
    fail() {
      currentStage.value = '未选择图片'
      runtimeNotice.value = '没有拿到图片，请重新从相册或相机选择。'
    },
  })
}

function resetOutputs() {
  uploadedUrl.value = ''
  maskUrl.value = ''
  depthUrl.value = ''
  bmpUrl.value = ''
  pod3dUrl.value = ''
  gcodeUrl.value = ''
  zGcodeUrl.value = ''
  stlUrl.value = ''
  profileUrl.value = ''
  guideUrl.value = ''
  zMoves.value = 0
  machineProfile.value = null
  gcodeLines.value = 0
  stlTriangles.value = 0
  taskId.value = null
  depthStats.value = null
  lastError.value = ''
  progress.value = 0
  optimizedUrl.value = ''
  currentStage.value = localImage.value ? '图片已选择' : '等待上传图片'
  runtimeNotice.value = ''
  usingLocalPreviewPackage.value = false
  processingFallbackReason.value = ''
  workflowTools.value = []
  craftStore.resetAssessment()
}

async function ensureLogin() {
  userStore.restoreLogin()
  if (userStore.isLogin) return

  try {
    const loginRes: any = await uni.login()
    if (!loginRes?.code) throw new Error('未获得微信登录凭证')
    await userStore.wxLogin(loginRes.code)
  } catch (e: any) {
    throw new Error('登录未完成，请先在“我的”登录后再生成交付图片')
  }
}

async function ensureUploaded() {
  if (uploadedUrl.value) return uploadedUrl.value
  if (!localImage.value) throw new Error('请先上传图片')

  await ensureLogin()
  currentStage.value = '上传图片'
  runtimeNotice.value = '正在把图片上传到后端，用于生成灰度 PNG / BMP。'
  try {
    uploadedUrl.value = await uploadImage(localImage.value)
  } catch (e: any) {
    const reason = e?.message || '上传接口不可用'
    uploadedUrl.value = ''
    processingFallbackReason.value = reason
    throw new Error(`上传失败，未生成图片：${reason}`)
  }
  return uploadedUrl.value
}

function getUploadedUrl(data: any) {
  if (!data) return ''
  return data.url || data.file_url || data.image_url || data.path || data.data?.url || data.data?.file_url || ''
}

function normalizeAssetUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('wxfile://') || url.startsWith('blob:')) return url

  const apiBase = getApiBaseUrl()
  const origin = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '')
  if (url.startsWith('http://localhost:8000') || url.startsWith('http://127.0.0.1:8000')) {
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, origin)
  }
  if (url.startsWith('/')) return `${origin}${url}`
  if (!/^https?:\/\//.test(url)) return `${origin}/${url.replace(/^\/+/, '')}`
  return url
}

function uploadImage(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: getUploadUrl(),
      filePath,
      name: 'file',
      header: userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {},
      success: (res: any) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`上传失败 ${res.statusCode}`))
          return
        }
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          const url = getUploadedUrl(data)
          if (url) resolve(url)
          else reject(new Error(data?.error || data?.message || '上传失败，未返回文件地址'))
        } catch {
          reject(new Error('上传响应解析失败'))
        }
      },
      fail: (err: any) => reject(new Error(err?.errMsg || '上传失败')),
    })
  })
}

async function runOneClick() {
  if (running.value) return
  if (!localImage.value) {
    chooseImage()
    return
  }

  running.value = true
  lastError.value = ''
  progress.value = 5
  currentStage.value = '启动工艺预检'
  runtimeNotice.value = '正在准备图片、登录态和生成参数。'
  usingLocalPreviewPackage.value = false
  processingFallbackReason.value = ''
  depthUrl.value = ''
  bmpUrl.value = ''
  maskUrl.value = ''
  taskId.value = null
  pod3dUrl.value = ''
  gcodeUrl.value = ''
  zGcodeUrl.value = ''
  stlUrl.value = ''
  profileUrl.value = ''
  guideUrl.value = ''
  zMoves.value = 0
  machineProfile.value = null
  gcodeLines.value = 0
  stlTriangles.value = 0
  workflowTools.value = []
  craftStore.resetAssessment()
  uni.showLoading({ title: 'AI生成中...' })

  try {
    let imageUrl = await ensureUploaded()
    await markProgress(12)

    if (usingLocalPreviewPackage.value || !imageUrl) {
      throw new Error('上传未完成，无法生成交付图片')
    } else {
    if (sourceKind.value === 'photo' && needOptimize.value) {
      currentStage.value = 'AI优化原图'
      runtimeNotice.value = '正在对原始图做画质增强（降噪/白平衡/对比度/锐化）。'
      try {
        const opt: any = await api.processing.optimize(imageUrl, 'enhance')
        const optUrl = normalizeAssetUrl(opt.optimized_url || '')
        if (optUrl) {
          optimizedUrl.value = optUrl
          imageUrl = optUrl
          runtimeNotice.value = 'AI优化完成，后续预检与2.5D基于优化图。'
        }
      } catch {
        optimizedUrl.value = ''
        runtimeNotice.value = 'AI优化接口不可用，继续用原始图处理。'
      }
      await markProgress(18)
    }

    if (sourceKind.value === 'photo') {
    currentStage.value = '工艺风险预检'
    runtimeNotice.value = '正在判断线条密度、刀面起伏、最小线宽和灰度反差。'
    syncCraftOptions()
    const assessment = await craftStore.assess(imageUrl)
    workflowTools.value.push(`工艺预检:${assessment?.source || '后端规则引擎'}`)
    if (assessment?.risk_image_url) assessment.risk_image_url = normalizeAssetUrl(assessment.risk_image_url)
    if (assessment?.report_url) assessment.report_url = normalizeAssetUrl(assessment.report_url)
    await markProgress(24)
    }

    try {
      if (sourceKind.value === 'photo') {
      currentStage.value = '抠图/掩膜'
      runtimeNotice.value = '正在生成前景掩膜；失败时会继续用原图做后续预览。'
      try {
        const segment: any = await api.processing.segment(imageUrl)
        maskUrl.value = normalizeAssetUrl(segment.mask_url || '')
        taskId.value = segment.task_id || taskId.value
        workflowTools.value.push(`前景掩膜:${segment.source || '后端分割工具'}`)
      } catch {
        maskUrl.value = ''
      }
      await markProgress(38)
      }

      const result = await generateLaserImages({
        processing: api.processing,
        imageUrl,
        maskUrl: maskUrl.value,
        format: deliveryFormat.value,
        sourceKind: sourceKind.value,
        normalizeUrl: normalizeAssetUrl,
        onStage: (name: string, percent: number) => {
          currentStage.value = name
          progress.value = percent
          runtimeNotice.value = `正在生成${name}；本流程只交付图片，不启动设备。`
        },
        onOutput: (output: any) => {
          if (output.pngUrl) {
            depthUrl.value = output.pngUrl
            taskId.value = output.depth.task_id || taskId.value
            workflowTools.value.push(sourceKind.value === 'gray' ? '已有灰度图:原灰阶校验转存（非AI）' : `灰度深度图:${output.depth.source || '后端 depth-v2 工具'}`)
          }
          if (output.bmpUrl) {
            bmpUrl.value = output.bmpUrl
            workflowTools.value.push('BMP:后端位图转换')
          }
          if (output.previewUrl) {
            pod3dUrl.value = output.previewUrl
            depthStats.value = output.preview.depth_stats || null
            workflowTools.value.push(`2.5D预览:${output.preview.source || '后端 pod-3d 工具'}`)
          }
        },
      })
      processingFallbackReason.value = result.previewWarning
      await markProgress(98)
    } catch (processingError: any) {
      throw processingError
    }
    }
    await markProgress(100)

    if (!packageReady.value) throw new Error('所选图片格式未生成完整，请重试')
    currentStage.value = '图片已生成'
    runtimeNotice.value = `${processingFallbackReason.value}图片已生成；自动同步门店电脑文件夹尚未接通，本操作不启动打印或雕刻。`
    uni.showToast({
      title: craftAssessment.value?.manual_review_required ? '需人工复核' : '图片已生成',
      icon: craftAssessment.value?.manual_review_required ? 'none' : 'success',
    })
  } catch (e: any) {
    lastError.value = toErrorMessage(e, '生成失败')
    currentStage.value = '生成失败'
    runtimeNotice.value = '请看下方错误信息，页面已保留当前图片和可重试入口。'
    uni.showToast({ title: lastError.value, icon: 'none' })
  } finally {
    uni.hideLoading()
    running.value = false
  }
}

function buildWorkRecord() {
  const craftPayload = craftStore.toProofPayload()
  const isLocalPreview = usingLocalPreviewPackage.value
  const manualReviewRequired = isLocalPreview || !!craftPayload?.manual_review_required
  return {
    id: Date.now(),
    type: 'image25d',
    title: '内雕交付图片',
    style: isLocalPreview ? '本机测试预览' : 'PNG/BMP图片',
    status: packageReady.value ? '图片已生成' : '待确认',
    delivery_status: 'not_synced',
    delivery_scope: 'desktop-image-folder',
    source_kind: sourceKind.value,
    material: material.value,
    size: sizeText.value,
    craft: craftProcess.value,
    ...capabilityMetadata(),
    delivery_format: deliveryFormat.value,
    need_optimize: needOptimize.value,
    optimized_url: optimizedUrl.value,
    craft_assessment: craftPayload,
    craft_job_id: craftPayload?.job_id || '',
    craft_risk_score: craftPayload?.risk_score ?? null,
    craft_grade: craftPayload?.grade || '',
    manual_review_required: manualReviewRequired,
    local_preview_package: isLocalPreview,
    processing_fallback_reason: processingFallbackReason.value,
    output_mode: isLocalPreview ? 'local-preview-only' : 'backend-generated',
    recommended_process: craftPayload?.recommended_process || craftProcess.value,
    risk_image_url: craftPayload?.risk_image_url || '',
    assessment_source: craftPayload?.source || '',
    source_url: uploadedUrl.value || localImage.value,
    mask_url: maskUrl.value,
    depth_url: depthUrl.value,
    bmp_url: bmpUrl.value,
    pod3d_url: pod3dUrl.value,
    z_gcode_url: zGcodeUrl.value,
    stl_url: stlUrl.value,
    machine_profile_url: profileUrl.value,
    guide_url: guideUrl.value,
    machine_profile: machineProfile.value,
    z_moves: zMoves.value,
    stl_triangles: stlTriangles.value,
    gcode_url: gcodeUrl.value,
    gcode_lines: gcodeLines.value,
    task_id: taskId.value,
    depth_stats: depthStats.value,
    created_at: new Date().toLocaleString(),
  }
}

function saveCurrentWork(showToast = true) {
  const works = readStoredList('mock_25d_works')
  const record = buildWorkRecord()
  const existingIndex = works.findIndex((item: any) => taskId.value && item.task_id === taskId.value && item.type === 'image25d')
  if (existingIndex >= 0) {
    record.id = works[existingIndex].id
    works.splice(existingIndex, 1)
  }
  works.unshift(record)
  uni.setStorageSync('mock_25d_works', works.slice(0, 20))
  if (showToast) uni.showToast({ title: '结果已保存', icon: 'success' })
  return record
}

function readStoredList(key: string) {
  const value = uni.getStorageSync(key)
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function saveWork() {
  saveCurrentWork(true)
}

function submitSample() {
  if (!packageReady.value) {
    uni.showToast({ title: '请先生成交付图片', icon: 'none' })
    return
  }
  if (!craftAssessment.value) {
    uni.showToast({ title: '请先完成工艺预检', icon: 'none' })
    return
  }
  const record = saveCurrentWork(false)
  uni.navigateTo({ url: `/pages/sample/submit?workId=${record.id}` })
}

function copyOutput(url: string, name: string) {
  if (!url) {
    uni.showToast({ title: '文件尚未生成', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: url,
    success() {
      uni.showToast({ title: `${name}链接已复制`, icon: 'success' })
    },
  })
}

function openOutput(item: OutputItem) {
  if (!item.ready || !['depth', 'bmp'].includes(item.key)) return copyOutput(item.url, item.name)
  uni.showActionSheet({
    itemList: ['导出图片原文件', '复制图片链接'],
    success: (result: any) => result.tapIndex === 0
      ? exportImageOutput(item.url, item.key === 'bmp' ? 'bmp' : 'png')
      : copyOutput(item.url, item.name),
  })
}

const exportingImage = ref(false)
async function exportImageOutput(url: string, format: 'png' | 'bmp') {
  if (exportingImage.value) return
  exportingImage.value = true
  try {
    const origin = getApiBaseUrl().replace(/\/(?:mp-api|api)\/?$/, '').replace(/\/$/, '')
    if (!url.startsWith(origin + '/uploads/') && !url.startsWith(origin + '/processed/')) {
      throw new Error('图片地址不是当前后台的交付文件，请重新生成')
    }
    const filename = `31du-laser-${taskId.value || Date.now()}.${format}`
    // #ifdef H5
    const response = await fetch(url, { redirect: 'error' })
    if (!response.ok) throw new Error('图片下载失败，请重试')
    const buffer = await response.arrayBuffer()
    validateRasterDownload(buffer, format)
    const objectUrl = URL.createObjectURL(new Blob([buffer], {type: `image/${format}`}))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.click()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
    uni.showToast({ title: '已发起文件下载，非门店同步', icon: 'none' })
    // #endif
    // #ifndef H5
    const wxApi = (globalThis as any).wx
    if (!wxApi?.getFileSystemManager || !wxApi?.shareFileMessage) throw new Error('当前客户端不支持原文件分享，可复制链接交给门店')
    const download: any = await new Promise((resolve, reject) => uni.downloadFile({url, success: resolve, fail: reject}))
    if (download.statusCode !== 200) throw new Error('图片下载失败，请重试')
    const fs = wxApi.getFileSystemManager()
    const read: any = await new Promise((resolve, reject) => fs.readFile({filePath: download.tempFilePath, success: resolve, fail: reject}))
    validateRasterDownload(read.data, format)
    const filePath = `${wxApi.env.USER_DATA_PATH}/${filename}`
    await new Promise((resolve, reject) => fs.writeFile({filePath, data: read.data, success: resolve, fail: reject}))
    await new Promise((resolve, reject) => wxApi.shareFileMessage({filePath, fileName: filename, success: resolve, fail: reject}))
    // #endif
  } catch (error: any) {
    uni.showToast({ title: toErrorMessage(error, '图片导出未完成'), icon: 'none' })
  } finally {
    exportingImage.value = false
  }
}

function copyDeliveryInfo() {
  const craftPayload = craftStore.toProofPayload()
  const riskItems = (craftPayload?.risk_items || []).map((item: any) => `${item.label}：${item.advice}`)
  const text = [
    '31度内雕图片交付',
    `预检结论：${craftBadgeText.value}`,
    `风险分：${craftPayload?.risk_score ?? '-'}/100`,
    `建议工艺：${craftPayload?.recommended_process || craftProcess.value}`,
    `材料/尺寸：${material.value} / ${sizeText.value}`,
    `制作场景：${applicationModes.value.find((item: any) => item.value === applicationMode.value)?.label || applicationMode.value}`,
    `激光器方案：${laserSources.value.find((item: any) => item.value === laserSource.value)?.label || laserSource.value}`,
    `交付格式：${requestedFormats.value.join(' + ')}`,
    `人工复核：${craftPayload?.manual_review_required ? '是' : '否'}`,
    `风险热区图：${craftPayload?.risk_image_url || '-'}`,
    `预检报告：${craftPayload?.report_url || '-'}`,
    `风险点：${riskItems.length ? riskItems.join('；') : '-'}`,
    `原图：${uploadedUrl.value || localImage.value || '-'}`,
    `PNG灰度图：${depthUrl.value || '-'}`,
    `BMP灰度位图：${bmpUrl.value || '-'}`,
    `2.5D预览图：${pod3dUrl.value || '-'}`,
    `任务：#${taskId.value || '-'}`,
    '交付目标：图片保存到对应门店电脑的指定文件夹。',
    '当前状态：图片已生成，自动同步门店文件夹尚未接通；不包含打印或雕刻操作。',
  ].join('\n')
  uni.setClipboardData({
    data: text,
    success() {
      uni.showToast({ title: '交付信息已复制', icon: 'success' })
    },
  })
}

function contactFallback() {
  uni.showToast({ title: '真机微信可联系客服', icon: 'none' })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度照片生成加工文件',
      path: '/pages/image25d/index?from=share',
    }
  },
}
</script>

<style lang="scss" scoped>
.image-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  background: $page-bg;
}

/* ---------- 顶部标题区 ---------- */
.hero {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 44rpx 32rpx 48rpx;
  background: $grad-red;
  border-radius: 0 0 40rpx 40rpx;
  overflow: hidden;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.13);
}

.hero-orb.orb-a {
  width: 280rpx;
  height: 280rpx;
  right: -90rpx;
  top: -110rpx;
}

.hero-orb.orb-b {
  width: 170rpx;
  height: 170rpx;
  left: -60rpx;
  bottom: -70rpx;
  background: rgba(255, 255, 255, 0.08);
}

.hero-copy {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.eyebrow {
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
  font-weight: 800;
}

.title {
  font-size: 52rpx;
  line-height: 1.1;
  font-weight: 900;
  color: #ffffff;
}

.subtitle {
  color: rgba(255, 255, 255, 0.92);
  font-size: 25rpx;
  line-height: 1.5;
}

.status-pill {
  position: relative;
  flex-shrink: 0;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
}

/* ---------- 主体 ---------- */
.body {
  padding: 0 $page-gap;
}

/* ---------- 流程步骤 ---------- */
.flow-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
  margin-top: $section-gap;
}

.flow-step {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: $card-bg;
  box-shadow: $card-shadow;
  color: $ink-muted;
  font-size: 22rpx;
}

.flow-step.done {
  color: $ok;
}

.flow-step.active {
  color: $brand-red-deep;
  background: rgba($brand-red, 0.08);
}

.step-no {
  font-weight: 900;
  font-size: 24rpx;
}

.step-text {
  font-weight: 700;
}

/* ---------- 上传大卡 ---------- */
.upload-card {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 340rpx;
  margin-top: $section-gap;
  border-radius: $card-radius;
  border: 2rpx dashed #c7cbd6;
  background: $card-bg;
  overflow: hidden;
}

.upload-image {
  width: 100%;
  height: 100%;
}

.upload-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  text-align: center;
}

.upload-plus {
  color: $brand-red;
  font-size: 80rpx;
  line-height: 1;
  font-weight: 300;
}

.upload-title {
  color: $ink-title;
  font-size: 30rpx;
  font-weight: 800;
}

.upload-desc {
  font-size: 22rpx;
  color: $ink-muted;
}

/* ---------- 卡片通用 ---------- */
.card {
  margin-top: $section-gap;
  padding: $card-padding;
  background: $card-bg;
  border-radius: $card-radius;
  box-shadow: $card-shadow;
}

.capability-card .chip-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.capability-card .option-chip {
  min-height: 64rpx;
  height: auto;
  padding-top: 8rpx;
  padding-bottom: 8rpx;
  line-height: 1.3;
}

.capability-note {
  display: block;
  color: $ink-muted;
  font-size: 21rpx;
  line-height: 1.5;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.title-bar {
  width: 8rpx;
  height: 32rpx;
  border-radius: 4rpx;
}

.title-bar.red { background: $grad-red; }

.title-text {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 800;
  color: $ink-title;
}

.panel-note {
  font-size: 22rpx;
  color: $ink-muted;
}

/* ---------- 优化分段控件 ---------- */
.segment {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 20rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: $field-bg;
}

.segment-item {
  height: 64rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $ink-body;
  font-size: 26rpx;
  font-weight: 700;
}

.segment-item.selected {
  background: $grad-red;
  color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba($brand-red-deep, 0.25);
}

.optimize-preview {
  width: 100%;
  height: 300rpx;
  margin-top: 20rpx;
  border-radius: 16rpx;
  background: $field-bg;
}

.optimize-note {
  display: block;
  margin-top: 14rpx;
  color: $ok;
  font-size: 22rpx;
  line-height: 1.45;
}

.optimize-note.dim {
  color: $ink-muted;
}

/* ---------- 参数 chips ---------- */
.option-block {
  margin-bottom: 24rpx;
}

.option-block:last-child {
  margin-bottom: 0;
}

.option-label {
  display: block;
  margin-bottom: 14rpx;
  color: $ink-muted;
  font-size: 22rpx;
  font-weight: 700;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.option-chip {
  height: 64rpx;
  border-radius: 32rpx;
  background: $field-bg;
  color: $ink-body;
  font-size: 24rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 12rpx;
  box-sizing: border-box;
  border: 2rpx solid transparent;
}

.option-chip.selected {
  background: rgba($brand-red, 0.08);
  border-color: $brand-red;
  color: $brand-red-deep;
}

/* ---------- 主按钮 ---------- */
.generate-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  margin-top: $section-gap;
  border-radius: 44rpx;
  background: $grad-red;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 800;
  padding: 0;
}

.generate-btn[disabled] {
  opacity: 0.5;
}

.generate-btn::after {
  border: none;
}

/* ---------- 状态卡 ---------- */
.status-card.warn {
  background: #FFF7F5;
}

.status-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.status-stage {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  font-weight: 800;
  color: $ink-title;
}

.status-percent {
  font-size: 24rpx;
  font-weight: 800;
  color: $brand-red-deep;
}

.progress-track {
  height: 14rpx;
  border-radius: 999rpx;
  overflow: hidden;
  background: $field-bg;
}

.progress-bar {
  height: 100%;
  border-radius: 999rpx;
  background: $grad-red;
  transition: width 0.18s ease;
}

.status-desc,
.status-warning,
.status-error {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  line-height: 1.5;
}

.status-desc {
  color: $ink-body;
}

.status-warning {
  color: $warn;
}

.status-error {
  color: $bad;
  font-weight: 800;
}

.runtime-card {
  background: #f7f9fc;
}

.runtime-line,
.runtime-note {
  display: block;
  line-height: 1.55;
}

.runtime-line {
  margin-top: 8rpx;
  color: $ink-title;
  font-size: 22rpx;
}

.runtime-note {
  margin-top: 10rpx;
  color: $ink-muted;
  font-size: 20rpx;
}

/* ---------- 报告卡 ---------- */
.effect-preview-card {
  background: #fbfcfe;
}

.preview-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
  margin-bottom: 14rpx;
}

.preview-tab {
  padding: 14rpx 6rpx;
  border-radius: 14rpx;
  background: $field-bg;
  color: $ink-muted;
  text-align: center;
  font-size: 22rpx;
}

.preview-tab.active {
  background: rgba($brand-red, 0.1);
  color: $brand-red-deep;
  font-weight: 800;
}

.preview-tab.disabled {
  opacity: 0.48;
}

.effect-preview-stage {
  min-height: 360rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: linear-gradient(145deg, #f1f4f8 0%, #d7dde6 100%);
  overflow: hidden;
}

.effect-preview-stage.depth {
  background: linear-gradient(145deg, #dfe4eb 0%, #a4afbe 100%);
}

.effect-preview-image {
  width: 94%;
  height: 340rpx;
  filter: drop-shadow(0 14rpx 18rpx rgba(31, 43, 61, 0.2));
}

.effect-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  color: $ink-muted;
  font-size: 23rpx;
}

.effect-preview-label,
.effect-preview-note {
  display: block;
}

.effect-preview-label {
  margin-top: 14rpx;
  color: $ink-title;
  font-size: 24rpx;
  font-weight: 800;
}

.effect-preview-note {
  margin-top: 8rpx;
  color: $ink-muted;
  font-size: 21rpx;
  line-height: 1.5;
}

.report-card.tone-pass { background: #F4FBF7; }
.report-card.tone-warn { background: #FFFAF0; }
.report-card.tone-danger { background: #FFF5F5; }

.risk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.risk-score {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.risk-score-num {
  font-size: 56rpx;
  line-height: 1;
  font-weight: 900;
  color: $ink-title;
}

.risk-score-total {
  font-size: 24rpx;
  color: $ink-muted;
}

.report-badge {
  flex-shrink: 0;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 800;
}

.report-badge.pass {
  background: rgba($ok, 0.12);
  color: $ok;
}

.report-badge.block {
  background: rgba($bad, 0.1);
  color: $bad;
}

.risk-subtitle {
  display: block;
  margin-bottom: 20rpx;
  color: $ink-body;
  font-size: 22rpx;
}

.risk-image {
  width: 100%;
  height: 300rpx;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  background: $field-bg;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.metric-item {
  min-height: 88rpx;
  border-radius: 16rpx;
  background: $field-bg;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6rpx;
  padding: 0 12rpx;
  box-sizing: border-box;
}

.metric-label {
  color: $ink-muted;
  font-size: 20rpx;
}

.metric-value {
  color: $ink-title;
  font-size: 24rpx;
  font-weight: 800;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.risk-item {
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: $field-bg;
  border-left: 6rpx solid #c7cbd6;
}

.risk-item.high { border-left-color: $bad; }
.risk-item.medium { border-left-color: $warn; }
.risk-item.low { border-left-color: $ok; }

.risk-item-title,
.risk-item-advice,
.manual-review-tip,
.craft-fallback {
  display: block;
}

.risk-item-title {
  color: $ink-title;
  font-size: 24rpx;
  font-weight: 800;
}

.risk-item-advice {
  margin-top: 6rpx;
  color: $ink-body;
  font-size: 22rpx;
  line-height: 1.5;
}

.manual-review-tip,
.craft-fallback {
  margin-top: 16rpx;
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: rgba($warn, 0.1);
  color: #b87900;
  font-size: 22rpx;
  line-height: 1.5;
}

.craft-fallback {
  background: rgba($bad, 0.08);
  color: $bad;
}

.craft-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 40rpx 20rpx;
  text-align: center;
}

.empty-icon {
  font-size: 56rpx;
  line-height: 1;
}

.empty-text {
  color: $ink-muted;
  font-size: 24rpx;
  line-height: 1.6;
}

/* ---------- 输出卡 ---------- */
.output-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.output-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 76rpx;
  padding: 0 18rpx;
  border-radius: 16rpx;
  background: $field-bg;
  border: 2rpx solid transparent;
}

.output-item.ready {
  background: rgba($ok, 0.06);
  border-color: rgba($ok, 0.3);
}

.output-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: $card-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  line-height: 1;
  flex-shrink: 0;
}

.output-name {
  flex: 1;
  min-width: 0;
  color: $ink-title;
  font-size: 24rpx;
  font-weight: 700;
}

.output-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d9dce5;
  flex-shrink: 0;
}

.output-dot.on {
  background: $ok;
}

.machine-note {
  margin-top: 20rpx;
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: rgba($brand-red, 0.05);
  color: $ink-body;
  font-size: 22rpx;
  line-height: 1.5;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 72rpx;
  margin-top: 8rpx;
  color: $ink-muted;
  font-size: 24rpx;
}

.toggle-arrow {
  color: $brand-red;
  font-size: 32rpx;
  line-height: 1;
}

/* ---------- 信息卡 ---------- */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.info-item {
  min-height: 76rpx;
  border-radius: 16rpx;
  background: $field-bg;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4rpx;
  padding: 0 18rpx;
}

.info-key {
  color: $ink-muted;
  font-size: 21rpx;
}

.info-val {
  color: $ink-title;
  font-size: 24rpx;
  font-weight: 800;
}

.delivery-flow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 16rpx;
}

.delivery-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 4rpx;
  border-radius: 16rpx;
  background: $field-bg;
}

.delivery-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: $grad-red;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delivery-text {
  color: $ink-body;
  font-size: 20rpx;
  font-weight: 700;
}

.info-tip {
  display: block;
  margin-top: 16rpx;
  color: $ink-muted;
  font-size: 22rpx;
  line-height: 1.55;
}

/* ---------- 底部操作按钮组 ---------- */
.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: $section-gap;
}

.ghost-btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background: $card-bg;
  box-shadow: $card-shadow;
  color: $ink-body;
  font-size: 24rpx;
  font-weight: 800;
  padding: 0;
}

.ghost-btn.primary {
  background: $grad-red;
  color: #ffffff;
  box-shadow: none;
}

.ghost-btn[disabled] {
  opacity: 0.5;
}

.ghost-btn::after {
  border: none;
}
</style>
