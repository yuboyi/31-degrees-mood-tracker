<template>
  <view class="page-editor">
    <canvas id="printArtworkCanvas" canvas-id="printArtworkCanvas" type="2d"
      style="position: fixed; left: -10000px; top: 0; width: 2px; height: 2px; pointer-events: none;" />
    <!-- 画布区域 -->
    <view class="canvas-area">
      <canvas
        id="editorCanvas"
        canvas-id="editorCanvas"
        type="2d"
        class="editor-canvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      />
      <image
        v-if="currentTemplate && !backgroundReady"
        class="template-preview"
        :src="currentTemplate.preview_url || currentTemplate.overlay_url"
        mode="aspectFit"
      />
      <view class="editor-brand-mark">
        <text class="editor-brand-symbol">31°</text>
        <text>31度文创</text>
      </view>

      <!-- 编辑工具栏 -->
      <view class="toolbar-top">
        <view class="tool-btn" @tap="goBack">
          <text class="tool-icon">←</text>
        </view>
        <view class="tool-btn" @tap="undoEdit">
          <text class="tool-icon">↩</text>
        </view>
        <view class="tool-btn" @tap="resetEdit">
          <text class="tool-icon">⟳</text>
        </view>
      </view>

      <!-- 提示文字 -->
      <view v-if="!bgImage && !currentTemplateId" class="canvas-hint">
        <text class="hint-icon">📸</text>
        <text class="hint-text">选择模板和照片开始编辑</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-panel">
      <!-- 功能 Tab -->
      <view class="func-tabs">
        <view
          v-for="tab in funcTabs"
          :key="tab.key"
          class="func-tab"
          :class="{ active: activeTab === tab.key }"
          @tap="activeTab = tab.key"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>

      <!-- 模板选择 -->
      <view v-if="activeTab === 'template' && !templates.length" class="catalog-status">
        <text>{{ templateLoading ? '正在加载模板...' : templateError ? '模板加载失败，请重试' : '当前成品没有已上架模板' }}</text>
        <button v-if="templateError" size="mini" @tap="loadTemplates">重新加载</button>
      </view>
      <view v-if="activeTab === 'template' && templates.length" class="catalog-search">
        <input v-model="templateQuery" class="catalog-search-input" type="text" maxlength="40" placeholder="搜索当前类别的产品或模板" />
        <text v-if="templateQuery" class="catalog-search-clear" @tap="templateQuery = ''">清除</text>
        <text class="catalog-search-count">{{ visibleTemplates.length }}/{{ templates.length }} 款</text>
      </view>
      <scroll-view v-if="activeTab === 'template' && templateTypes.length" scroll-x class="product-type-strip">
        <view class="product-type-inner">
          <view
            class="product-type-chip"
            :class="{ selected: selectedTemplateTypeId === null }"
            @tap="selectTemplateType(null)"
          >
            <text>全部成品</text>
          </view>
          <view
            v-for="item in templateTypes"
            :key="item.id"
            class="product-type-chip"
            :class="{ selected: selectedTemplateTypeId === item.id }"
            @tap="selectTemplateType(item.id)"
          >
            <text>{{ item.name }}</text>
            <text class="product-type-meta">{{ item.customization_type }}</text>
          </view>
        </view>
      </scroll-view>
      <view v-if="activeTab === 'template' && templates.length && !visibleTemplates.length" class="catalog-status">
        <text>没有匹配的已上架模板，试试其他关键词</text>
      </view>
      <scroll-view v-if="activeTab === 'template' && visibleTemplates.length" scroll-x class="template-strip">
        <view class="template-strip-inner">
          <view
            v-for="tpl in visibleTemplates"
            :key="tpl.id"
            class="template-thumb"
            :class="{ selected: currentTemplateId === tpl.id }"
            @tap="selectTemplate(tpl)"
          >
            <image :src="tpl.preview_url || tpl.overlay_url" class="thumb-img" mode="aspectFit" />
            <view class="thumb-caption">
              <text>{{ tpl.name }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 背景照片 -->
      <view v-if="activeTab === 'background'" class="bg-picker">
        <view class="bg-option" @tap="pickPhoto">
          <text class="bg-icon">📷</text>
          <text class="bg-label">拍照</text>
        </view>
        <view class="bg-option" @tap="pickAlbum">
          <text class="bg-icon">🖼</text>
          <text class="bg-label">相册</text>
        </view>
        <view class="bg-option" @tap="setBgColor">
          <text class="bg-icon">🎨</text>
          <text class="bg-label">纯色</text>
        </view>
      </view>

      <!-- 调节 -->
      <view v-if="activeTab === 'adjust'" class="adjust-panel">
        <view class="adjust-row">
          <text class="adjust-label">缩放</text>
          <slider
            :value="scale / fitScale * 50"
            :min="25"
            :max="150"
            block-size="20"
            activeColor="#dc2626"
            @change="onScaleChange"
          />
          <text class="adjust-val">{{ Math.round(scale / fitScale * 100) }}%</text>
        </view>
        <view class="adjust-row">
          <text class="adjust-label">旋转</text>
          <slider
            :value="rotation + 180"
            :min="0"
            :max="360"
            block-size="20"
            activeColor="#dc2626"
            @change="onRotationChange"
          />
          <text class="adjust-val">{{ rotation }}°</text>
        </view>
        <view class="adjust-row">
          <text class="adjust-label">X偏移</text>
          <slider
            :value="offsetX + 100"
            :min="0"
            :max="200"
            block-size="20"
            activeColor="#dc2626"
            @change="(e) => { offsetX = e.detail.value - 100; render() }"
          />
        </view>
        <view class="adjust-row">
          <text class="adjust-label">Y偏移</text>
          <slider
            :value="offsetY + 100"
            :min="0"
            :max="200"
            block-size="20"
            activeColor="#dc2626"
            @change="(e) => { offsetY = e.detail.value - 100; render() }"
          />
        </view>
      </view>

      <!-- AI 功能 -->
      <view v-if="activeTab === 'ai'" class="ai-panel">
        <view class="ai-btn" @tap="runVectorize">
          <text class="ai-btn-icon">✏️</text>
          <text class="ai-btn-text">矢量雕刻</text>
        </view>
        <view class="ai-btn" @tap="runDepthEstimate">
          <text class="ai-btn-icon">🔮</text>
          <text class="ai-btn-text">深度浮雕</text>
        </view>
        <view class="ai-btn" @tap="runLogoExtract">
          <text class="ai-btn-icon">✂️</text>
          <text class="ai-btn-text">智能抠图</text>
        </view>
      </view>

      <view v-if="editorScene === 'inkjet'" class="print-package-card">
        <view class="print-head">
          <view>
            <text class="print-title">导出喷墨 PNG 图片</text>
            <text class="print-subtitle">只导出图案，不含产品底图。图片交给门店电脑保存到指定文件夹，后续打印由门店软件处理。</text>
          </view>
          <text class="print-state">{{ printSubmitting ? '导出中' : '待导出' }}</text>
        </view>

        <text class="package-result">{{ printPlanLabel }}</text>
        <text class="package-result">自动同步到门店电脑尚未接通；当前仅导出 PNG 图片，不代表已保存到门店文件夹，也不会启动打印。</text>

        <view class="print-actions">
          <view class="btn-package" :class="{ disabled: !canSave || !printPlan || printSubmitting }" @tap="exportPrintArtwork">
            {{ printSubmitting ? '导出中...' : '导出打印图' }}
          </view>
        </view>
      </view>

      <!-- 保存 -->
      <view class="save-bar">
        <view class="btn-save" :class="{ disabled: !canSave }" @tap="onSave">
          <text class="btn-save-text">
            保存效果预览{{ currentTemplate && currentTemplate.points_cost != null ? ' · ' + currentTemplate.points_cost + '积分' : '' }}
          </text>
        </view>
        <view v-if="isMachineMode" class="btn-send-machine" :class="{ disabled: !canSave }" @tap="onSendToMachine">
          <text class="btn-send-text">发送到设备</text>
        </view>
      </view>
    </view>

    <!-- AI 结果弹窗 -->
    <view v-if="aiResultVisible" class="modal-overlay" @tap="closeAIResult">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">{{ aiResultTitle }}</text>
        <image :src="aiResultUrl" class="modal-img" mode="widthFix" />
        <view class="modal-actions">
          <view class="btn-primary" @tap="applyAIResult">应用效果</view>
          <view class="btn-secondary" @tap="closeAIResult">取消</view>
        </view>
      </view>
    </view>

    <!-- 积分扣减确认弹窗 -->
    <view v-if="confirmVisible" class="modal-overlay">
      <view class="modal-content">
        <text class="modal-title">确认保存</text>
        <text class="confirm-desc">{{ deductionInfo }}</text>
        <view class="modal-actions">
          <view class="btn-primary" @tap="doSave">确认</view>
          <view class="btn-secondary" @tap="cancelSave">取消</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api, getApiBaseUrl } from '@/api'
import { uploadImage } from '@/utils/image'
import { createImageJobGate, serverImagePath, resultImageUrl } from '@/utils/editorAiFlow.mjs'
import { useAppStore } from '@/stores/store'
import { previewRect, clipArtistArea, artistBounds, isOfficialTemplate } from '@/utils/artistPreview.mjs'
import { printArtworkPlan, drawPrintArtwork, effectivePhotoDpi, pngWithDpi } from '@/utils/printArtwork.mjs'

const appStore = useAppStore()
const editorScene = ref<'inkjet' | 'laser'>('inkjet')
const editorTitle = computed(() => editorScene.value === 'laser' ? '激光工艺定制' : 'UV 彩印定制')

// --- Tab ---
const activeTab = ref('template')
const funcTabs = [
  { key: 'template', label: '模板' },
  { key: 'background', label: '背景' },
  { key: 'adjust', label: '调节' },
  { key: 'ai', label: 'AI' }
]

// --- Template ---
const templates = ref<any[]>([])
const templateQuery = ref('')
const visibleTemplates = computed(() => {
  const query = templateQuery.value.trim().toLocaleLowerCase()
  return query ? templates.value.filter(item => String(item.name || '').toLocaleLowerCase().includes(query)) : templates.value
})
const templateTypes = ref<any[]>([])
const selectedTemplateTypeId = ref<number | string | null>(null)
const currentTemplateId = ref<number | string>(0)
const currentTemplate = ref<any>(null)
let officialCatalog: any = null
let catalogFailed = false
const templateSide = ref('front')
const modelReady = ref(false)
const overlayReady = ref(true)

// --- Canvas ---
const canvasWidth = ref(320)
const canvasHeight = ref(420)
const scale = ref(1.0)
const fitScale = ref(1.0)
const rotation = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)
const bgImage = ref('')
const bgColor = ref('#ffffff')
const backgroundReady = ref(false)

const canSave = computed(() => !!(backgroundReady.value && currentTemplateId.value !== 0 &&
  overlayReady.value && (!isOfficialTemplate(currentTemplate.value) ||
  (modelReady.value && currentTemplate.value.preview_ready))))

const printSubmitting = ref(false)
const printPlan = computed(() => {
  try { return printArtworkPlan(currentTemplate.value, templateSide.value) } catch { return null }
})
const printPlanLabel = computed(() => {
  try {
    const p = printArtworkPlan(currentTemplate.value, templateSide.value)
    return `${currentTemplate.value.name} · ${p.widthMm} × ${p.heightMm} mm · ${p.width} × ${p.height} 像素 · 文件 ${p.dpi} DPI（非喷头精度）`
  } catch (e: any) { return e.message }
})

// AI
const aiResultVisible = ref(false)
const aiResultUrl = ref('')
const aiResultTitle = ref('图像处理结果')
const aiBusy = ref(false)
const aiJobGate = createImageJobGate()
onUnmounted(() => aiJobGate.invalidate())

// 积分确认
const confirmVisible = ref(false)
const deductionInfo = ref('')

// Machine mode
const isMachineMode = ref(false)
const machineId = ref(0)
const machineCodeVal = ref('')
let pendingMachineSave = false  // 替代 window 全局变量，小程序不支持 window

// Canvas 2D 实例
let canvas: any = null
let ctx: any = null
let bgImgObj: any = null   // Image object for background photo
let overlayImgObj: any = null // Image object for template overlay
let modelImgObj: any = null

// Touch state
let touchStartX = 0
let touchStartY = 0
let lastDistance = 0

// --- 初始化 ---
let pendingSourceUrl = ''

onLoad((options: any) => {
  if (options?.id) currentTemplateId.value = String(options.id).startsWith('admin:')
    ? String(options.id) : parseInt(options.id)
  if (options?.scene === 'laser') editorScene.value = 'laser'
  if (options?.scene === 'inkjet') editorScene.value = 'inkjet'
  uni.setNavigationBarTitle({ title: editorTitle.value })
  // Check if coming from machine context
  if (options?.machine_id) {
    isMachineMode.value = true
    machineId.value = parseInt(options.machine_id)
    machineCodeVal.value = options?.machine_code || ''
  }
  // Check if coming from materials with a source_url
  if (options?.source_url) {
    pendingSourceUrl = decodeURIComponent(options.source_url)
  }
})

onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  canvasWidth.value = sysInfo.windowWidth - 32
  canvasHeight.value = Math.round(canvasWidth.value * 1.33)

  await initCanvas()
  await loadTemplateTypes()
  await loadTemplates()
  if (currentTemplateId.value) {
    const tpl = templates.value.find((t: any) => t.id === currentTemplateId.value)
    if (tpl) selectTemplate(tpl)
  }
  // Load background image if opened from materials
  if (pendingSourceUrl) {
    loadBgImage(pendingSourceUrl)
    pendingSourceUrl = ''
  }
})

// --- Canvas 2D 初始化 ---
function initCanvas(): Promise<void> {
  return new Promise((resolve) => {
    const query = uni.createSelectorQuery()
    query.select('#editorCanvas')
      .fields({ node: true, size: true })
      .exec((res: any) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('Canvas node not found, retrying...')
          setTimeout(() => initCanvas().then(resolve), 300)
          return
        }
        canvas = res[0].node
        const dpr = uni.getSystemInfoSync().pixelRatio
        canvas.width = canvasWidth.value * dpr
        canvas.height = canvasHeight.value * dpr
        ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        console.log('Canvas 2D initialized', canvasWidth.value, canvasHeight.value, dpr)
        render()
        resolve()
      })
  })
}

// --- 模板 ---
const templateLoading = ref(false)
const templateError = ref(false)
let templateRequestId = 0

async function loadTemplates() {
  const requestId = ++templateRequestId
  templateLoading.value = true
  templateError.value = false
  templates.value = []
  try {
    if (catalogFailed) {
      await loadTemplateTypes()
      if (catalogFailed) throw new Error('正式模板目录加载失败')
    }
    const res: any = officialCatalog
      ? { templates: officialCatalog.templates.filter((item: any) =>
          selectedTemplateTypeId.value === null || item.template_type_id === selectedTemplateTypeId.value) }
      : await api.template.list(undefined, selectedTemplateTypeId.value as number || undefined)
    if (requestId !== templateRequestId) return
    if (!Array.isArray(res.templates)) throw new Error('模板接口返回格式不匹配')
    templates.value = normalizeTemplates(res.templates)
  } catch (e) {
    if (requestId !== templateRequestId) return
    templateError.value = true
    templates.value = []
  } finally {
    if (requestId === templateRequestId) templateLoading.value = false
  }
}

async function loadTemplateTypes() {
  try {
    const official = await api.template.officialCatalog()
    if (official.enabled !== true && official.enabled !== false) throw new Error('目录来源未确认')
    officialCatalog = official.enabled ? official : null
    const res: any = officialCatalog || await api.templateTypes.list()
    const expected = editorScene.value === 'inkjet' ? '彩印喷墨' : '光学激光'
    templateTypes.value = Array.isArray(res.template_types)
      ? res.template_types.filter((item: any) => item.is_active !== false && item.customization_type === expected)
      : []
    catalogFailed = false
  } catch {
    catalogFailed = true
    officialCatalog = null
    templateTypes.value = []
  }
}

async function selectTemplateType(id: number | string | null) {
  selectedTemplateTypeId.value = id
  templateQuery.value = ''
  currentTemplateId.value = 0
  currentTemplate.value = null
  modelImgObj = null
  modelReady.value = false
  loadOverlayImage('')
  await loadTemplates()
}

function normalizeTemplates(list: any[]) {
  const sceneType = editorScene.value === 'inkjet' ? 'inkjet' : 'laser'
  const selected = list
    .filter((item: any) => !item.product_type || item.product_type === sceneType)
    .map((item: any) => ({
      ...item,
      preview_url: normalizeTemplateAsset(item.preview_url),
      overlay_url: normalizeTemplateAsset(item.overlay_url),
    }))
  return selected
}

function normalizeTemplateAsset(url: string) {
  if (!url) return ''
  if (url.startsWith('/static/')) return url
  return url
}


function selectTemplate(tpl: any) {
  if (isOfficialTemplate(tpl) && tpl.image_count === 2 && currentTemplateId.value === tpl.id) {
    uni.showActionSheet({ itemList: ['编辑正面', '查看背面 / 编辑背面'], success: (res: any) => {
      if (res.tapIndex === 1 && !tpl.back_print_area) {
        uni.showToast({ title: '后台未配置背面打印区域，仅可查看原图', icon: 'none' })
        if (tpl.back_model_url) uni.previewImage({ urls: [tpl.back_model_url] })
        return
      }
      applyTemplate(tpl, res.tapIndex === 1 ? 'back' : 'front')
    } })
    return
  }
  applyTemplate(tpl, 'front')
}

function applyTemplate(tpl: any, side: string) {
  // A saved task package belongs to the previous design, not the next template.
  currentTemplateId.value = tpl.id
  currentTemplate.value = tpl
  templateSide.value = side
  modelImgObj = null
  modelReady.value = false
  if (tpl.width && tpl.height) {
    canvasHeight.value = Math.round(canvasWidth.value * (tpl.height / tpl.width))
    if (canvas) {
      const dpr = uni.getSystemInfoSync().pixelRatio
      canvas.width = canvasWidth.value * dpr
      canvas.height = canvasHeight.value * dpr
      ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
    }
  }
  // 加载模板 overlay 图片
  loadOverlayImage(tpl.overlay_url)
  if (isOfficialTemplate(tpl)) {
    if (!tpl.preview_ready) {
      uni.showToast({ title: '该模板打印区域尚未通过校验', icon: 'none' })
      return
    }
    const image = createCanvasImage()
    modelImgObj = image
    image.onload = () => {
      if (modelImgObj !== image) return
      modelReady.value = true
      fitBackground()
      render()
    }
    image.onerror = () => {
      if (modelImgObj !== image) return
      modelImgObj = null
      modelReady.value = false
      uni.showToast({ title: '美工原图加载失败，暂不能保存效果', icon: 'none' })
      render()
    }
    image.src = side === 'back' ? tpl.back_model_url : tpl.model_url
  } else {
    fitBackground()
  }
}

function createCanvasImage() {
  if (typeof canvas?.createImage === 'function') return canvas.createImage()
  // #ifdef H5
  const image = new Image()
  image.crossOrigin = 'anonymous'
  return image
  // #endif
  throw new Error('当前环境不支持画布图片加载')
}

function loadOverlayImage(src: string) {
  overlayReady.value = !src
  if (!src) {
    overlayImgObj = null
    render()
    return
  }
  const image = createCanvasImage()
  overlayImgObj = image
  image.onload = () => { if (overlayImgObj === image) { overlayReady.value = true; render() } }
  image.onerror = () => {
    if (overlayImgObj !== image) return
    overlayImgObj = null
    overlayReady.value = false
    uni.showToast({ title: '模板图片加载失败，请重新选择', icon: 'none' })
    render()
  }
  image.src = src
}

// --- 图片选择 ---
function pickPhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res: any) => {
      loadBgImage(res.tempFilePaths[0])
    }
  })
}

function pickAlbum() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (res: any) => {
      loadBgImage(res.tempFilePaths[0])
    }
  })
}

function loadBgImage(src: string) {
  aiJobGate.invalidate()
  aiResultVisible.value = false
  aiResultUrl.value = ''
  bgImage.value = src
  backgroundReady.value = false
  const image = createCanvasImage()
  bgImgObj = image
  image.onload = () => {
    if (bgImgObj !== image) return
    backgroundReady.value = true
    fitBackground()
    render()
  }
  image.onerror = () => {
    if (bgImgObj !== image) return
    bgImgObj = null
    bgImage.value = ''
    backgroundReady.value = false
    uni.showToast({ title: '照片加载失败，请重新选择', icon: 'none' })
    render()
  }
  image.src = src
}

function fitBackground() {
  if (!bgImgObj || !backgroundReady.value) return
  let area = { width: canvasWidth.value, height: canvasHeight.value }
  if (isOfficialTemplate(currentTemplate.value)) {
    if (!currentTemplate.value.preview_ready) return
    area = artistBounds(currentTemplate.value,
      previewRect(currentTemplate.value, canvasWidth.value, canvasHeight.value, templateSide.value))
  }
  scale.value = Math.max(area.width / bgImgObj.width, area.height / bgImgObj.height)
  fitScale.value = scale.value
  offsetX.value = 0
  offsetY.value = 0
  rotation.value = 0
}

function setBgColor() {
  const colors = ['#ffffff', '#f5f5f5', '#e8f4f8', '#ffe8e8', '#e8ffe8', '#f0e8ff', '#000000']
  const names = ['白色', '浅灰', '浅蓝', '浅红', '浅绿', '浅紫', '黑色']
  uni.showActionSheet({
    itemList: names,
    success: (res: any) => {
      aiJobGate.invalidate()
      aiResultVisible.value = false
      aiResultUrl.value = ''
      bgColor.value = colors[res.tapIndex]
      bgImage.value = ''
      bgImgObj = null
      backgroundReady.value = true
      render()
    }
  })
}

// --- 渲染 ---
function render() {
  if (!ctx) return

  const w = canvasWidth.value
  const h = canvasHeight.value

  if (isOfficialTemplate(currentTemplate.value)) {
    ctx.clearRect(0, 0, w, h)
    if (!modelReady.value || !currentTemplate.value.preview_ready) return
    ctx.drawImage(modelImgObj, 0, 0, w, h)
    if (!backgroundReady.value) return
    const area = previewRect(currentTemplate.value, w, h, templateSide.value)
    const bounds = artistBounds(currentTemplate.value, area)
    if (printPlan.value) {
      ctx.save()
      ctx.translate(area.x, area.y)
      drawPrintArtwork(ctx, currentTemplate.value, printPlan.value, bgImgObj,
        artworkState(area), area.width, area.height)
      ctx.restore()
      return
    }
    ctx.save()
    clipArtistArea(ctx, currentTemplate.value, area)
    if (bgImgObj) {
      ctx.translate(bounds.x + bounds.width / 2 + offsetX.value, bounds.y + bounds.height / 2 + offsetY.value)
      ctx.rotate(rotation.value * Math.PI / 180)
      ctx.scale(scale.value, scale.value)
      ctx.drawImage(bgImgObj, -bgImgObj.width / 2, -bgImgObj.height / 2)
    } else {
      ctx.fillStyle = bgColor.value
      ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()
    return
  }

  // 清除
  ctx.clearRect(0, 0, w, h)

  // 背景色
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, w, h)

  // 背景图片
  if (bgImgObj && backgroundReady.value) {
    ctx.save()
    ctx.translate(w / 2 + offsetX.value, h / 2 + offsetY.value)
    ctx.scale(scale.value, scale.value)
    ctx.rotate((rotation.value * Math.PI) / 180)

    const imgW = bgImgObj.width
    const imgH = bgImgObj.height
    ctx.drawImage(bgImgObj, -imgW / 2, -imgH / 2, imgW, imgH)
    ctx.restore()
  }

  // 模板叠加层
  if (overlayImgObj && overlayImgObj.width > 0 && overlayImgObj.height > 0) {
    ctx.globalAlpha = 0.85
    ctx.drawImage(overlayImgObj, 0, 0, w, h)
    ctx.globalAlpha = 1.0
  }
}

// --- 触摸处理 ---
function onTouchStart(e: any) {
  if (e.touches.length === 2) {
    // 双指缩放
    const dx = e.touches[0].x - e.touches[1].x
    const dy = e.touches[0].y - e.touches[1].y
    lastDistance = Math.sqrt(dx * dx + dy * dy)
  } else if (e.touches.length === 1) {
    touchStartX = e.touches[0].x
    touchStartY = e.touches[0].y
  }
}

function onTouchMove(e: any) {
  if (!bgImgObj) return

  if (e.touches.length === 2) {
    const dx = e.touches[0].x - e.touches[1].x
    const dy = e.touches[0].y - e.touches[1].y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (lastDistance > 0) {
      scale.value = Math.max(fitScale.value * 0.5, Math.min(fitScale.value * 3, scale.value * (dist / lastDistance)))
    }
    lastDistance = dist
    render()
  } else if (e.touches.length === 1) {
    offsetX.value += (e.touches[0].x - touchStartX)
    offsetY.value += (e.touches[0].y - touchStartY)
    touchStartX = e.touches[0].x
    touchStartY = e.touches[0].y
    render()
  }
}

function onTouchEnd() {
  lastDistance = 0
}

function onScaleChange(e: any) {
  scale.value = fitScale.value * e.detail.value / 50
  render()
}

function onRotationChange(e: any) {
  rotation.value = e.detail.value - 180
  render()
}

function undoEdit() {
  offsetX.value = 0; offsetY.value = 0
  fitBackground()
  render()
}

function resetEdit() {
  aiJobGate.invalidate()
  aiResultVisible.value = false; aiResultUrl.value = ''
  bgImage.value = ''; bgImgObj = null; bgColor.value = '#ffffff'; backgroundReady.value = false
  offsetX.value = 0; offsetY.value = 0
  scale.value = 1.0; rotation.value = 0
  currentTemplateId.value = 0; currentTemplate.value = null
  modelImgObj = null; modelReady.value = false; overlayReady.value = true
  fitScale.value = 1
  overlayImgObj = null
  render()
}

// --- AI ---
async function runVectorize() {
  await runEditorAI('vector', api.ai.imageToVector)
}

async function runDepthEstimate() {
  await runEditorAI('depth', api.ai.depthEstimate)
}

async function runLogoExtract() {
  await runEditorAI('cutout', api.ai.extractLogo)
}

async function prepareAIInput(source: string) {
  if (!uni.getStorageSync('token')) throw new Error('请先在“我的”登录，再处理照片')
  const existing = serverImagePath(source, getApiBaseUrl())
  if (existing) return existing
  let filePath = source
  if (/^https?:\/\//.test(source)) {
    filePath = await new Promise<string>((resolve, reject) => uni.downloadFile({
      url: source,
      success: (res: any) => res.statusCode === 200 && res.tempFilePath
        ? resolve(res.tempFilePath) : reject(new Error('源照片下载失败，请重新选择')),
      fail: () => reject(new Error('源照片下载失败，请重新选择')),
    }))
  }
  const uploaded = await uploadImage(filePath)
  const path = serverImagePath(uploaded, getApiBaseUrl())
  if (!path) throw new Error('照片上传接口尚未匹配当前账号目录，请更新前后端后重试')
  return path
}

async function runEditorAI(kind: string, process: (url: string) => Promise<any>) {
  if (aiBusy.value) return
  if (!bgImage.value || !backgroundReady.value) {
    uni.showToast({ title: '请先选择并加载照片', icon: 'none' }); return
  }
  aiBusy.value = true
  aiResultUrl.value = ''; aiResultVisible.value = false
  uni.showLoading({ title: '照片处理中...', mask: true })
  let notice = ''
  try {
    const result = await aiJobGate.run(bgImage.value, prepareAIInput, async (source: string) => {
      const response = await process(source)
      const displayUrl = resultImageUrl(response, kind, getApiBaseUrl())
      await new Promise<void>((resolve, reject) => uni.getImageInfo({
        src: displayUrl, success: () => resolve(), fail: () => reject(new Error('效果图无法读取，已保留原照片')),
      }))
      return { ...response, displayUrl }
    })
    if (!result) return
    aiResultUrl.value = result.displayUrl
    aiResultTitle.value = result.is_ai === false
      ? (kind === 'vector' ? '轮廓线稿（非AI生成）' : '传统抠图（请检查边缘）') : 'AI 处理结果'
    aiResultVisible.value = true
    notice = result.notice || ''
  } catch (e: any) {
    aiResultVisible.value = false
    notice = e.message || '处理失败，已保留原照片'
  } finally {
    aiBusy.value = false
    uni.hideLoading()
  }
  if (notice) uni.showToast({ title: notice, icon: 'none', duration: 4500 })
}

function applyAIResult() {
  loadBgImage(aiResultUrl.value)
  aiResultVisible.value = false
}

function closeAIResult() {
  aiResultVisible.value = false
}

function artworkState(area: any) {
  return { zoom: scale.value / fitScale.value, rotation: rotation.value,
    offsetX: offsetX.value / area.width, offsetY: offsetY.value / area.height,
    background: bgColor.value }
}

function uploadTempFile(filePath: string): Promise<string> {
  return uploadImage(filePath)
}

async function exportPrintArtwork() {
  if (!canSave.value || printSubmitting.value) return
  printSubmitting.value = true
  try {
    const template = currentTemplate.value
    const plan = printArtworkPlan(template, templateSide.value)
    const photo = bgImgObj
    const area = previewRect(template, canvasWidth.value, canvasHeight.value, templateSide.value)
    const state = artworkState(area)
    const effectiveDpi = effectivePhotoDpi(plan, photo, state.zoom)
    const decision: any = await new Promise(resolve => uni.showModal({
      title: '导出喷墨 PNG 图片',
      content: `${template.name}，${plan.widthMm} × ${plan.heightMm} mm，仅${templateSide.value === 'front' ? '正面' : '背面'}图案，不含产品底图。${effectiveDpi !== null && effectiveDpi < 150 ? `原照片有效精度约 ${effectiveDpi} DPI，放大可能模糊，建议换高清照片。` : ''}当前导出 PNG 原文件，自动同步门店文件夹尚未接通。本操作不下单、不扣费、不启动打印。`,
      confirmText: '导出原文件', success: resolve, fail: () => resolve({confirm:false}),
    }))
    if (!decision.confirm) return
    // Snapshot check: never export another template/photo after an async confirmation.
    if (currentTemplate.value !== template || bgImgObj !== photo || templateSide.value !== plan.side ||
        JSON.stringify(artworkState(area)) !== JSON.stringify(state)) throw new Error('设计已变化，请重新确认导出')
    const printCanvas: any = await new Promise((resolve, reject) => {
      uni.createSelectorQuery().select('#printArtworkCanvas').fields({node:true,size:true}).exec((rows: any) => {
        if (rows?.[0]?.node) resolve(rows[0].node)
        else reject(new Error('打印画布不可用，请重试'))
      })
    })
    printCanvas.width = plan.width; printCanvas.height = plan.height
    const printContext = printCanvas.getContext('2d')
    printContext.clearRect(0, 0, plan.width, plan.height)
    drawPrintArtwork(printContext, template, plan, photo, state)
    // H5's uni exporter crops using the hidden element's 2px CSS size.
    // Read the full backing canvas instead of silently producing a blank image.
    // #ifdef H5
    const tempFile: string = printCanvas.toDataURL('image/png')
    // #endif
    // #ifndef H5
    const tempFile: string = await new Promise((resolve, reject) => uni.canvasToTempFilePath({
      canvas: printCanvas, canvasId: 'printArtworkCanvas', fileType:'png',
      x:0, y:0, width:plan.width, height:plan.height,
      destWidth:plan.width, destHeight:plan.height,
      success:(r:any)=>resolve(r.tempFilePath), fail:reject,
    }))
    // #endif
    const filename = `31du-artwork-${plan.templateId}-${plan.side}-${plan.widthMm}x${plan.heightMm}mm-${plan.dpi}dpi.png`
    // #ifdef H5
    const response = await fetch(tempFile)
    if (!response.ok) throw new Error('打印图读取失败')
    const bytes = pngWithDpi(await response.arrayBuffer(), plan.dpi)
    const url = URL.createObjectURL(new Blob([bytes], {type:'image/png'}))
    const link = document.createElement('a')
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    // #endif
    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    const buffer: ArrayBuffer = await new Promise((resolve,reject)=>fs.readFile({filePath:tempFile,success:(r:any)=>resolve(r.data),fail:reject}))
    const bytes = pngWithDpi(buffer, plan.dpi)
    const filePath = `${wx.env.USER_DATA_PATH}/${filename}`
    await new Promise((resolve,reject)=>fs.writeFile({filePath,data:bytes.buffer,success:resolve,fail:reject}))
    if (!wx.shareFileMessage) throw new Error('当前微信版本不支持发送原文件，请更新微信后重试')
    await new Promise((resolve,reject)=>wx.shareFileMessage({filePath,fileName:filename,success:resolve,fail:reject}))
    // #endif
  } catch (e: any) {
    uni.showToast({ title: e.message || e.errMsg || '打印图导出失败', icon: 'none' })
  } finally {
    printSubmitting.value = false
  }
}

// --- 保存 ---
function onSave() {
  if (!canSave.value) return
  pendingMachineSave = false

  if (isOfficialTemplate(currentTemplate.value)) {
    deductionInfo.value = '保存美工原图合成效果预览，不扣积分、不创建加工订单；成品以实际打样为准'
  } else if (Number(currentTemplateId.value) < 0) {
    deductionInfo.value = '当前使用本地演示模板，将直接生成预览，不扣除积分'
  } else if (appStore.isScanEntry && appStore.currentStore) {
    deductionInfo.value = `扫码进入 · 门店「${appStore.currentStore.name}」代付 ${currentTemplate.value?.points_cost} 积分`
  } else {
    deductionInfo.value = `从您的账户扣除 ${currentTemplate.value?.points_cost} 积分`
  }
  confirmVisible.value = true
}

function cancelSave() {
  confirmVisible.value = false
  pendingMachineSave = false
}

async function doSave() {
  confirmVisible.value = false
  if (!canSave.value) return

  // Check if this is a machine save
  if (pendingMachineSave) {
    pendingMachineSave = false
    return doMachineSave()
  }

  // 使用 Canvas 2D toTempFilePath
  uni.canvasToTempFilePath({
    canvas,
    canvasId: 'editorCanvas',
    success: async (res: any) => {
      try {
        if (!isOfficialTemplate(currentTemplate.value) && Number(currentTemplateId.value) > 0) {
          await api.points.deduct({
            template_id: Number(currentTemplateId.value),
            store_id: appStore.entryStoreId || undefined,
            mode: appStore.deductionMode
          })
        }

        // #ifdef H5
        uni.previewImage({ urls: [res.tempFilePath], current: 0 })
        return
        // #endif
        // #ifndef H5
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.showToast({ title: isOfficialTemplate(currentTemplate.value) ? '预览已生成' : '保存成功', icon: 'success' })
            setTimeout(() => uni.navigateBack(), 1500)
          },
          fail: () => {
            uni.previewImage({ urls: [res.tempFilePath], current: 0 })
          }
        })
        // #endif
      } catch (e: any) {
        uni.showToast({ title: e.message || '保存失败', icon: 'none' })
      }
    },
    fail: (err: any) => {
      uni.showToast({ title: '导出图片失败', icon: 'none' })
    }
  })
}

// --- Machine mode: send to device ---
async function onSendToMachine() {
  if (!canSave.value || !isMachineMode.value) return
  if (isOfficialTemplate(currentTemplate.value)) {
    uni.showToast({ title: '正式模板尚未核准设备下发，请导出图片交门店处理', icon: 'none' })
    return
  }
  if (Number(currentTemplateId.value) < 0) {
    uni.showToast({ title: '演示模板仅供预览，请选择已上架模板', icon: 'none' })
    return
  }

  if (appStore.isScanEntry && appStore.currentStore) {
    deductionInfo.value = `扫码进入 · 门店「${appStore.currentStore.name}」代付 ${currentTemplate.value?.points_cost} 积分`
  } else {
    deductionInfo.value = `从您的账户扣除 ${currentTemplate.value?.points_cost} 积分`
  }
  confirmVisible.value = true
  pendingMachineSave = true
}

async function doMachineSave() {
  confirmVisible.value = false
  if (!canSave.value || isOfficialTemplate(currentTemplate.value)) return

  uni.canvasToTempFilePath({
    canvas,
    canvasId: 'editorCanvas',
    success: async (res: any) => {
      uni.showLoading({ title: '上传图片...' })
      // Upload the generated image
      try {
        const uploadRes = await uploadImage(res.tempFilePath)

        uni.hideLoading()

        // Create machine order
        const { useMachineStore } = await import('@/stores/machine')
        const machineStore = useMachineStore()
        await machineStore.createOrder({
          machine_id: machineId.value,
          template_id: Number(currentTemplateId.value),
          source_image_url: uploadRes,
          ai_processing_type: undefined,
          deduction_mode: appStore.deductionMode,
        })

        uni.navigateTo({ url: '/pages/machine/status' })
      } catch (e: any) {
        uni.hideLoading()
        uni.showToast({ title: e.message || '发送失败', icon: 'none' })
      }
    },
    fail: () => {
      uni.showToast({ title: '导出图片失败', icon: 'none' })
    }
  })
}

function goBack() {
  uni.navigateBack()
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31° 激光雕刻 · 照片编辑与模板定制',
      path: '/pages/editor/editor',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · AI赋能照片编辑，一键雕刻',
    }
  },
}
</script>

<style lang="scss" scoped>
.catalog-status {
  padding: 24rpx;
  text-align: center;
  color: #667085;
}

.page-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-dark;
}

.canvas-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 16rpx;
}

.editor-canvas {
  background: $bg-card;
  border-radius: 8rpx;
  max-width: 100%;
}

.template-preview {
  position: absolute;
  top: 16px;
  left: 50%;
  z-index: 1;
  width: min(68vw, 560px);
  height: min(68vw, 560px);
  transform: translateX(-50%);
  pointer-events: none;
}

.editor-brand-mark {
  position: absolute;
  top: 22rpx;
  right: 24rpx;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 12rpx 8rpx 8rpx;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(23, 26, 35, 0.66);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 24rpx;
  font-size: 18rpx;
  font-weight: 700;
}

.editor-brand-symbol {
  display: inline-flex;
  width: 34rpx;
  height: 34rpx;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #d94c4c;
  border-radius: 50%;
  font-size: 15rpx;
  font-weight: 900;
}

.canvas-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.hint-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.hint-text { font-size: 24rpx; color: $text-secondary; }

.toolbar-top {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  right: 16rpx;
  display: flex;
  gap: 16rpx;
}

.tool-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-card-hover;
  border-radius: 50%;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

.tool-icon {
  font-size: 32rpx;
  color: $text-primary;
}

.bottom-panel {
  background: $bg-card;
  border-radius: 24rpx 24rpx 0 0;
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.06);
  padding-bottom: env(safe-area-inset-bottom, 16rpx);
}

.func-tabs {
  display: flex;
  padding: 20rpx 32rpx;
  gap: 8rpx;
}

.func-tab {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: $text-secondary;
  border-bottom: 2rpx solid transparent;
  transition: 0.2s;

  &.active {
    color: $primary;
    border-color: $primary;
  }
}

.template-strip {
  padding: 0 16rpx 20rpx;
  white-space: nowrap;

  .template-strip-inner {
    display: flex;
    gap: 16rpx;
  }
}

.catalog-search {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin: 0 16rpx 16rpx;
  padding: 0 16rpx;
  min-height: 64rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.12);
  border-radius: 12rpx;
  background: $bg-card-hover;
}

.catalog-search-input {
  flex: 1;
  min-width: 0;
  height: 64rpx;
  font-size: 24rpx;
  color: $text-primary;
}

.catalog-search-clear {
  padding: 12rpx 0;
  color: $primary;
  font-size: 22rpx;
}

.catalog-search-count {
  color: $text-secondary;
  font-size: 20rpx;
  white-space: nowrap;
}

.product-type-strip {
  padding: 0 16rpx 16rpx;
  white-space: nowrap;
}

.product-type-inner {
  display: flex;
  gap: 12rpx;
}

.product-type-chip {
  display: inline-flex;
  flex-direction: column;
  gap: 2rpx;
  padding: 10rpx 18rpx;
  border-radius: 8rpx;
  background: $bg-card-hover;
  color: $text-secondary;
  font-size: 22rpx;
  line-height: 1.2;

  &.selected {
    background: rgba(220, 38, 38, 0.1);
    color: $primary;
  }
}

.product-type-meta {
  font-size: 18rpx;
  opacity: 0.72;
}

.template-thumb {
  width: 140rpx;
  height: 180rpx;
  border-radius: 12rpx;
  overflow: hidden;
  border: 3rpx solid transparent;
  background: $bg-card-hover;
  position: relative;

  &.selected {
    border-color: $primary;
  }

  .thumb-img {
    width: 100%;
    height: 100%;
  }

  .thumb-caption {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 8rpx 6rpx;
    background: rgba(0, 0, 0, 0.56);
    text-align: center;

    text {
      color: #fff;
      font-size: 20rpx;
      line-height: 1.2;
    }
  }
}

.bg-picker {
  display: flex;
  gap: 48rpx;
  padding: 20rpx 32rpx 24rpx;
  justify-content: center;
}

.bg-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.bg-icon { font-size: 48rpx; }

.bg-label { font-size: 22rpx; color: $text-secondary; }

.adjust-panel {
  padding: 16rpx 32rpx 24rpx;
}

.adjust-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.adjust-label {
  font-size: 24rpx;
  color: $text-secondary;
  width: 64rpx;
}

.adjust-val {
  font-size: 22rpx;
  color: $primary;
  width: 64rpx;
  text-align: right;
}

slider { flex: 1; }

.ai-panel {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx 24rpx;
}

.ai-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 12rpx;
  background: rgba($primary, 0.08);
  border-radius: 16rpx;
  border: 1rpx solid rgba($primary, 0.15);

  &:active { background: rgba($primary, 0.15); }
}

.ai-btn-icon { font-size: 36rpx; }

.ai-btn-text {
  font-size: 20rpx;
  color: $primary;
}

.print-package-card {
  margin: 18rpx 32rpx 0;
  padding: 18rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba($primary, 0.16);
  background: #fff7f7;
}

.print-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.print-title,
.print-subtitle,
.print-state,
.field-label,
.package-result {
  display: block;
}

.print-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #7f1d1d;
}

.print-subtitle {
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 1.35;
  color: #8a5a5a;
}

.print-state {
  flex: 0 0 auto;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 22rpx;
  font-weight: 600;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.chip {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba($primary, 0.18);
  color: #7f1d1d;
  font-size: 22rpx;
  background: #ffffff;

  &.active {
    color: #ffffff;
    background: $primary;
    border-color: $primary;
  }
}

.print-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin-bottom: 14rpx;

  &.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.field-box {
  min-width: 0;
}

.field-label {
  margin-bottom: 8rpx;
  color: #7f1d1d;
  font-size: 22rpx;
}

.field-input {
  min-height: 60rpx;
  box-sizing: border-box;
  padding: 12rpx;
  border-radius: 10rpx;
  background: #ffffff;
  color: #1f2937;
  font-size: 24rpx;
}

.picker-input {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  min-height: 64rpx;
  padding: 10rpx 12rpx;
  border-radius: 12rpx;
  background: #ffffff;
  color: #3f1d1d;
  font-size: 23rpx;
}

.print-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.btn-package {
  min-height: 68rpx;
  padding: 0 22rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  font-size: 24rpx;
  font-weight: 700;

  &.disabled {
    opacity: 0.45;
  }
}

.package-result {
  flex: 1;
  min-width: 240rpx;
  color: #7f1d1d;
  font-size: 22rpx;
  line-height: 1.35;
  word-break: break-all;
}

.save-bar {
  padding: 16rpx 32rpx 24rpx;
  display: flex;
  gap: 16rpx;
}

.btn-save {
  flex: 1;
  padding: 26rpx 0;
  text-align: center;
  background: linear-gradient(135deg, $primary, #ef4444);
  border-radius: 16rpx;

  &.disabled { opacity: 0.4; }

  .btn-save-text {
    font-size: 30rpx;
    color: #fff;
    font-weight: 700;
  }
}

.btn-send-machine {
  padding: 26rpx 32rpx;
  text-align: center;
  background: linear-gradient(135deg, $accent, #ea580c);
  border-radius: 16rpx;

  &.disabled { opacity: 0.4; }

  .btn-send-text {
    font-size: 26rpx;
    color: #fff;
    font-weight: 700;
    white-space: nowrap;
  }
}

// Modals
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  width: 85%;
  background: $bg-card;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: 24rpx;
}

.modal-img {
  width: 100%;
  border-radius: 16rpx;
  max-height: 600rpx;
}

.confirm-desc {
  font-size: 26rpx;
  color: $text-secondary;
  display: block;
  margin-bottom: 32rpx;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 20rpx 0;
  border-radius: 16rpx;
  font-size: 26rpx;
}

.btn-primary {
  background: $primary;
  color: #fff;
  font-weight: 600;
}

.btn-secondary {
  background: $bg-card-hover;
  color: $text-secondary;
}
</style>
