<template>
  <view class="booth-page">
    <!-- 蓝色渐变 Hero -->
    <view class="hero">
      <view class="hero-orb orb-a"></view>
      <view class="hero-orb orb-b"></view>
      <text class="eyebrow">31度 AI拍照打印</text>
      <text class="title">拍照，变成你的成品</text>
      <text class="subtitle">拍照 → AI风格效果 → 选择成品 → 询价与打印</text>
    </view>

    <view class="body">
      <!-- 拍照上传大卡 -->
      <view class="camera-card" @tap="capture">
        <image v-if="localImage" class="camera-image" :src="localImage" mode="aspectFit" />
        <view v-else class="camera-empty">
          <text class="camera-icon">📸</text>
          <text class="camera-title">点击拍照 / 选照片</text>
          <text class="camera-desc">人像正面照效果最佳 · 最大10M · png/jpg</text>
        </view>
      </view>

      <view class="customization-toggle" @tap="showCustomization = !showCustomization">
        <text>{{ showCustomization ? '收起成品与风格选择' : selectedTemplateType ? `已选${selectedTemplateType.name} · 修改成品与风格` : '选择成品与风格' }}</text>
        <text class="toggle-arrow">{{ showCustomization ? '⌃' : '⌄' }}</text>
      </view>

      <!-- 与管理后台“模板类型管理”对应的成品目录 -->
      <view v-if="showCustomization" class="card product-card">
        <view class="section-title">
          <view class="title-bar blue"></view>
          <text class="title-text">选择成品类型</text>
          <text class="panel-note">来自后台启用目录</text>
        </view>
        <view v-if="templateTypes.length" class="product-grid">
          <view
            v-for="item in templateTypes"
            :key="item.id"
            class="product-chip"
            :class="{ active: templateTypeId === item.id }"
            @tap="selectTemplateType(item)"
          >
            <image v-if="item.image_url" class="product-type-image" :src="normalize(item.image_url)" mode="aspectFit" />
            <text class="product-name">{{ item.name }}</text>
            <text class="product-meta">{{ item.customization_type }} · {{ item.image_count || '图片要求待配置' }}</text>
            <text v-if="item.description" class="product-desc">{{ item.description }}</text>
          </view>
        </view>
        <text v-else class="product-empty">{{ catalogError ? '成品目录读取失败，请重试；未选成品不能询价。' : '暂无可用彩印成品，暂不能询价。' }}</text>
        <button v-if="catalogError" size="mini" @tap="loadTemplateTypes">重新读取成品</button>
        <text v-if="selectedTemplateType" class="product-note">
          当前成品：{{ selectedTemplateType.name }} · {{ selectedTemplateType.customization_type }} · 报价待后台确认
        </text>
      </view>

      <!-- 风格模板 3 列网格 -->
      <view v-if="showCustomization" class="card">
        <view class="section-title">
          <view class="title-bar blue"></view>
          <text class="title-text">选择风格模板</text>
          <text class="panel-note">AI抠图 + 换背景 + 调色</text>
        </view>
        <view class="style-grid">
          <view
            v-for="item in styles"
            :key="item.value"
            class="style-chip"
            :class="{ active: template === item.value }"
            @tap="tapStyle(item)"
          >
            <view class="style-swatch" :class="'swatch-' + item.value">
              <text v-if="item.value === 'custom'" class="swatch-plus">+</text>
            </view>
            <text class="style-name">{{ item.label }}</text>
            <text class="style-desc">{{ item.desc }}</text>
            <view v-if="item.value === 'custom'" class="custom-badge">上传背景</view>
          </view>
        </view>
        <text v-if="template === 'custom'" class="brand-note">{{ brandBgUrl ? '品牌背景已选择：' + brandBgUrl : '先点击「品牌定制」上传品牌背景图' }}</text>
      </view>

      <!-- 主 / 次按钮 -->
      <view class="action-main">
        <button class="btn-primary" :disabled="busy" @tap="runStyle">
          {{ styleBusy ? 'AI风格处理中…' : '生成AI风格效果' }}
        </button>
      </view>

      <!-- 结果双卡 -->
      <view v-if="styledUrl || pod3dUrl" class="result-grid">
        <view class="result-card">
          <text class="result-label">图案预览</text>
          <view class="result-canvas">
            <image v-if="styledUrl" class="result-image" :src="styledUrl" mode="aspectFit" />
            <text v-else class="result-empty">生成后显示</text>
          </view>
        </view>
      </view>

      <!-- 成品效果预览：先让消费者确认视觉效果，再进入报价和生产门禁 -->
      <view v-if="styledUrl" class="card product-preview-card">
        <view class="section-title">
          <view class="title-bar blue"></view>
          <text class="title-text">成品效果预览</text>
          <text class="panel-note">仅视觉确认</text>
        </view>
        <view v-if="mockupAsset" class="product-preview-stage">
          <view class="product-mockup" :class="'mockup-' + mockupKind">
            <image :key="mockupAsset" class="mockup-base" :src="mockupAsset" mode="aspectFit" @load="baseLoaded = true" @error="baseLoaded = false" />
            <view class="mockup-art-slot">
              <image :key="previewUrl" class="mockup-art" :src="previewUrl" mode="aspectFit" @load="artLoaded = true" @error="artLoaded = false" />
            </view>
          </view>
        </view>
        <text v-else class="product-preview-note">{{ selectedTemplateType ? '所选成品缺少类型图片，请选择有图片的成品。' : '请先展开上方“选择成品与风格”，选定成品后再确认效果。' }}</text>
        <text v-if="mockupAsset && (!artLoaded || !baseLoaded)" class="product-preview-note">预览图片尚未完整显示，暂不能确认或询价。</text>
        <text class="product-preview-title">排版示意：{{ selectedTemplateType?.name || '未选择成品' }}</text>
        <text class="product-preview-note">底图来自后台成品类型，叠加位置仅为排版示意，不是实物打样或精确打印区域。实际尺寸、材质和色彩需门店确认。</text>
        <text v-if="selectedTemplateType?.image_count === '需要正反面'" class="product-preview-note">此成品需要正反面。当前仅有正面，询价会标注缺少背面素材，不能直接生产。</text>
        <checkbox-group @change="previewConfirmed = $event.detail.value.includes('confirmed')">
          <label><checkbox value="confirmed" :checked="previewConfirmed" :disabled="!mockupAsset || busy || !artLoaded || !baseLoaded" />我已查看当前成品与图案示意</label>
        </checkbox-group>
      </view>

      <view v-if="photoJobId && showCustomization" class="card runtime-card">
        <view class="section-title">
          <view class="title-bar blue"></view>
          <text class="title-text">本次运行工具</text>
          <text class="panel-note">接口回传</text>
        </view>
        <text class="runtime-line">AI照片：{{ styleRuntimeLabel }}</text>
        <text class="runtime-note">{{ styleRuntimeNote }}</text>
      </view>

      <!-- 与后端 PhotoJob 生产门禁对应：先锁定设计快照，再等待付款与备料。 -->
      <view v-if="photoJobId && styledUrl" class="card production-card">
        <view class="section-title">
          <view class="title-bar gold"></view>
          <text class="title-text">询价与打印准备</text>
          <text class="panel-note">设计、报价、生产分开确认</text>
        </view>
        <view class="production-grid">
          <picker :range="materialOptions" :value="materialIndex" @change="onMaterialChange">
            <view class="production-field"><text>材料</text><text class="field-value">{{ materialOptions[materialIndex] }}</text></view>
          </picker>
          <picker :range="sizeOptions" :value="sizeIndex" @change="onSizeChange">
            <view class="production-field"><text>尺寸</text><text class="field-value">{{ sizeOptions[sizeIndex] }}</text></view>
          </picker>
          <view class="production-field"><text>工艺</text><text class="field-value">彩印喷墨</text></view>
        </view>
        <view class="production-status">
          <text>当前状态：{{ productionStatusLabel }}</text>
          <text>报价：{{ quotePoints ? quotePoints + ' 积分' : '待后台/门店确认' }}</text>
        </view>
        <button class="primary-btn" :disabled="productionBusy || busy || !previewConfirmed || !selectedTemplateType || !mockupAsset || !artLoaded || !baseLoaded" @tap="lockProduction">
          {{ productionBusy && productionAction === 'lock' ? '提交中…' : '提交询价，锁定设计' }}
        </button>
        <view v-if="productionStatus === 'awaiting_quote' && lockedDesignSignature === designSignature" class="production-gate">
          <text>询价设计已保存，待门店确认价格、素材和材料。当前未付款、未创建打印订单。</text>
        </view>
      </view>

      <text v-if="notice" class="notice">{{ notice }}</text>

      <!-- 底部操作按钮组 -->
      <view class="action-row">
        <button class="ghost-btn" :disabled="!styledUrl" @tap="saveWork">保存作品</button>
        <button class="ghost-btn" @tap="copyInfo">复制活动信息</button>
        <button class="ghost-btn gold" open-type="contact" @tap="contactFallback">预订咨询</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api, getApiBaseUrl, getUploadUrl } from '@/api'
import { useUserStore } from '@/stores/user'
import { useAgentHandoffStore } from '@/stores/agentHandoff'
import { selectablePhotoTypes, keepSelectedPhotoType } from '@/utils/photoProductChoice.mjs'

const userStore = useUserStore()
const localImage = ref('')
const template = ref('summer')
const showCustomization = ref(false)
const previewConfirmed = ref(false)
const artLoaded = ref(false)
const baseLoaded = ref(false)
const lockedDesignSignature = ref('')
const catalogError = ref(false)
const styledUrl = ref('')
const pod3dUrl = ref('')
const depthUrl = ref('')
const previewMode = ref<'style' | '25d'>('style')
const styleRuntimeLabel = ref('等待调用 AI 照片工具')
const depthRuntimeLabel = ref('等待调用 2.5D 工作流')
const styleRuntimeNote = ref('等待照片工具返回真实图片后显示预览。')
const styleReadyForDepth = ref(false)
const photoJobId = ref<number | null>(null)
const designRevision = ref('')
const photoJobStatus = ref('')
const productionStatus = ref('')
const productionAction = ref('')
const productionBusy = ref(false)
const quotePoints = ref(0)
const materialOptions = ['按成品类型确认', '亚克力', '金属', '木质', '皮革', '玻璃', '织物']
const sizeOptions = ['按成品规格确认', '需门店协助测量']
const processOptions = ['uv-print']
const materialIndex = ref(0)
const sizeIndex = ref(0)
const processIndex = ref(0)
const machines = ref<any[]>([])
const machinesLoaded = ref(false)
const machineIndex = ref(0)
const selectedMachineId = ref<number | null>(null)
const busy = ref(false)
const styleBusy = ref(false)
const depthBusy = ref(false)
const notice = ref('')
const templateTypes = ref<any[]>([])
const templateTypeId = ref<number | null>(null)
const templateTypesLoaded = ref(false)

const styles = [
  { value: 'summer', label: '清凉夏日', desc: '蓝天渐变' },
  { value: 'red', label: '国潮红', desc: '节日喜庆' },
  { value: 'blue', label: '赛博蓝', desc: '科技未来' },
  { value: 'gold', label: '暖金', desc: '尊贵质感' },
  { value: 'white', label: '纯净白', desc: '证件大片' },
  { value: 'custom', label: '品牌定制', desc: '上传品牌背景' },
]

const brandBgUrl = ref('')
const selectedTemplateType = computed(() =>
  templateTypes.value.find((item) => item.id === templateTypeId.value) || null,
)
const previewUrl = computed(() => styledUrl.value)
const canContinue25d = computed(() => Boolean(styledUrl.value && styleReadyForDepth.value))
const mockupKind = computed(() => {
  if (previewMode.value === '25d') {
    const material = materialOptions[materialIndex.value] || ''
    if (/金属|铝/.test(material)) return 'metal'
    if (/木/.test(material)) return 'wood'
    return 'crystal'
  }
  const text = `${selectedTemplateType.value?.name || ''}${selectedTemplateType.value?.customization_type || ''}`
  if (/水晶|玻璃|内雕/.test(text)) return 'crystal'
  if (/金属|铝|铭牌|打标/.test(text)) return 'metal'
  if (/衣|服|帆布|帽/.test(text)) return 'tshirt'
  return 'phone'
})
const mockupAsset = computed(() => normalize(selectedTemplateType.value?.image_url || ''))
const templateRevision = computed(() => selectedTemplateType.value?.preview_revision || '')
const designSignature = computed(() => JSON.stringify([styledUrl.value, templateTypeId.value, templateRevision.value, materialIndex.value, sizeIndex.value, processIndex.value]))
watch([designRevision, templateRevision], () => { previewConfirmed.value = false })
watch([styledUrl, templateTypeId, materialIndex, sizeIndex, processIndex], () => { previewConfirmed.value = false })
watch(styledUrl, () => { artLoaded.value = false })
watch(mockupAsset, () => { baseLoaded.value = false; previewConfirmed.value = false })
const machineLabels = computed(() => machines.value.map((item: any) => `${item.name || item.machine_name || '未命名设备'} · ${item.status || 'unknown'}`))
const productionStatusLabel = computed(() => productionStatus.value === 'awaiting_quote' && lockedDesignSignature.value !== designSignature.value
  ? '请核对设置并重新提交询价' : ({
  '': '待锁定设计',
  not_requested: '待提交询价',
  awaiting_quote: '待门店报价',
  awaiting_payment: '待支付 / 待备料',
  submitted: '已提交设备队列',
  processing: '设备处理中',
  completed: '已完成',
  failed: '处理失败',
}[productionStatus.value] || productionStatus.value || '待锁定设计'))

function pickBrandBg() {
  if (busy.value || productionBusy.value) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album'],
    success(res: any) {
      brandBgUrl.value = res.tempFilePaths?.[0] || ''
      if (brandBgUrl.value) {
        template.value = 'custom'
        uni.showToast({ title: '品牌背景已选择', icon: 'success' })
      }
    },
  })
}

function tapStyle(item: { value: string; label: string; desc: string }) {
  if (busy.value || productionBusy.value) return
  if (item.value === 'custom') {
    pickBrandBg()
    return
  }
  template.value = item.value
}

let pendingJobId = 0
let jobReadVersion = 0
onLoad((options: any) => {
  const jobId = Number(options?.photo_job_id || 0)
  pendingJobId = Number.isSafeInteger(jobId) && jobId > 0 ? jobId : 0
})

onShow(async () => {
  if (pendingJobId) {
    const jobId = pendingJobId
    pendingJobId = 0
    await loadPhotoJob(jobId)
  } else {
    await consumeAgentHandoff()
  }
  await loadTemplateTypes()
})

function clearPhotoJob() {
  photoJobId.value = null
  designRevision.value = ''
  photoJobStatus.value = ''
  productionStatus.value = ''
  productionAction.value = ''
  quotePoints.value = 0
  localImage.value = ''
  styledUrl.value = ''
  depthUrl.value = ''
  pod3dUrl.value = ''
  templateTypeId.value = null
  lockedDesignSignature.value = ''
  previewConfirmed.value = false
  artLoaded.value = false
  baseLoaded.value = false
  materialIndex.value = 0
  sizeIndex.value = 0
  processIndex.value = 0
  brandBgUrl.value = ''
  styleReadyForDepth.value = false
  styleRuntimeLabel.value = '正在核实照片任务'
  styleRuntimeNote.value = '以当前账号可读取的已保存设计为准。'
}

async function loadPhotoJob(jobId: number) {
  const version = ++jobReadVersion
  clearPhotoJob()
  busy.value = true
  notice.value = '正在读取照片任务，请稍候。'
  try {
    const job: any = await api.photoJobs.get(jobId)
    if (version !== jobReadVersion) return
    if (!job || Number(job.id) !== jobId || !Number.isSafeInteger(jobId) || jobId <= 0) {
      throw new Error('照片任务返回结果不匹配')
    }
    photoJobId.value = Number(job.id)
    designRevision.value = job.design_revision || ''
    photoJobStatus.value = job.status || ''
    productionStatus.value = job.production_status || ''
    localImage.value = normalize(job.source_image_url || '')
    styledUrl.value = normalize(job.optimized_image_url || '')
    depthUrl.value = normalize(job.depth_url || '')
    pod3dUrl.value = normalize(job.pod3d_url || '')
    if (job.template) template.value = String(job.template)
    if (job.background_image_url) brandBgUrl.value = normalize(job.background_image_url)
    if (job.template_type_id) templateTypeId.value = Number(job.template_type_id)
    quotePoints.value = Number(job.quote_points || 0)
    const snapshot = job.production_snapshot
    lockedDesignSignature.value = ''
    if (snapshot?.product_type === 'inkjet' && snapshot.process === 'uv-print'
      && snapshot.optimized_image_url === job.optimized_image_url
      && snapshot.template_type_id === job.template_type_id) {
      const material = materialOptions.indexOf(snapshot.material_type)
      const size = sizeOptions.indexOf(snapshot.size)
      if (material >= 0 && size >= 0) {
        materialIndex.value = material
        sizeIndex.value = size
        processIndex.value = 0
        lockedDesignSignature.value = JSON.stringify([styledUrl.value, templateTypeId.value, snapshot.template_revision || '', material, size, 0])
      }
    }
    styleRuntimeLabel.value = '历史任务，未返回工具运行明细'
    styleRuntimeNote.value = '这里只展示已保存图片，不据此推断它属于生成式AI卡通。'
    notice.value = '已核实并载入照片任务，请选择成品并重新确认当前预览。'
    if (!templateTypeId.value) showCustomization.value = true
  } catch {
    if (version !== jobReadVersion) return
    clearPhotoJob()
    notice.value = '照片任务读取失败或无权访问，未载入可提交的设计。请重新打开任务或生成照片。'
    uni.showToast({ title: '照片任务读取失败', icon: 'none' })
  } finally {
    if (version === jobReadVersion) busy.value = false
  }
}

async function loadTemplateTypes() {
  catalogError.value = false
  try {
    const result: any = await api.templateTypes.list()
    templateTypes.value = selectablePhotoTypes(result)
    if (keepSelectedPhotoType(templateTypes.value, templateTypeId.value) === null && templateTypeId.value !== null) {
      notice.value = '原成品已停用或不属于彩印，请重新选择成品并确认预览；不会自动替换。'
      templateTypeId.value = null
      previewConfirmed.value = false
      showCustomization.value = true
    }
  } catch {
    catalogError.value = true
    templateTypes.value = []
    templateTypeId.value = null
    previewConfirmed.value = false
    showCustomization.value = true
  } finally {
    templateTypesLoaded.value = true
  }
}

function selectTemplateType(item: any) {
  if (busy.value || productionBusy.value) return
  if (!templateTypes.value.some(type => type.id === item.id)) return
  templateTypeId.value = item.id
}

async function consumeAgentHandoff() {
  try {
    const store = useAgentHandoffStore()
    if (!store.hasHandoff || !store.payload) return
    if (store.path && store.path.replace(/^\//, '').split('?')[0] !== 'pages/photobooth/index') return
    const p: any = store.consumeHandoff()
    const jobId = Number(p?.photo_job_id)
    if (Number.isSafeInteger(jobId) && jobId > 0) {
      await loadPhotoJob(jobId)
    } else {
      ++jobReadVersion
      clearPhotoJob()
      busy.value = false
      notice.value = 'AI预览缺少有效任务编号，未载入可询价设计，请重新生成。'
    }
  } catch {
    clearPhotoJob()
    notice.value = 'AI结果读取失败，请重新打开照片任务。'
  }
}

function capture() {
  if (busy.value || productionBusy.value) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success(res: any) {
      const file = res.tempFiles?.[0]
      const path = (res.tempFilePaths?.[0] || '') as string
      const name = file?.name || path.split('?')[0]
      const ext = name.split('.').pop()?.toLowerCase() || ''
      const mime = file?.type || ''
      // H5 blob URLs have no extension; use File metadata to validate them.
      if (!path || (!['png', 'jpg', 'jpeg'].includes(ext) && !['image/png', 'image/jpeg'].includes(mime))) {
        uni.showToast({ title: '仅支持png、jpg格式', icon: 'none' })
        return
      }
      if ((file?.size || 0) > 10 * 1024 * 1024) {
        uni.showToast({ title: '图片请控制在10M以内', icon: 'none' })
        return
      }
      localImage.value = path
      styledUrl.value = ''
      pod3dUrl.value = ''
      depthUrl.value = ''
      photoJobId.value = null
      photoJobStatus.value = ''
      productionStatus.value = ''
      styleRuntimeLabel.value = '等待调用 AI 照片工具'
      depthRuntimeLabel.value = '等待调用 2.5D 工作流'
      styleRuntimeNote.value = '等待照片工具返回真实图片后显示预览。'
      styleReadyForDepth.value = false
      quotePoints.value = 0
      machines.value = []
      machinesLoaded.value = false
      selectedMachineId.value = null
      notice.value = ''
    },
    fail() {
      uni.showToast({ title: '没有拿到照片', icon: 'none' })
    },
  })
}

function normalize(url: string) {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('wxfile://') || url.startsWith('blob:')) return url
  const apiBase = getApiBaseUrl()
  const origin = apiBase.replace(/\/(?:mp-api|api)\/?$/, '').replace(/\/$/, '')
  if (url.startsWith('http://localhost:8000') || url.startsWith('http://127.0.0.1:8000')) {
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, origin)
  }
  if (url.startsWith('/')) return `${origin}${url}`
  if (!/^https?:\/\//.test(url)) return `${origin}/${url.replace(/^\/+/, '')}`
  return url
}

async function ensureLogin() {
  userStore.restoreLogin()
  if (userStore.isLogin) return
  // #ifdef MP-WEIXIN
  const loginRes: any = await uni.login()
  if (!loginRes?.code) throw new Error('未获取到微信登录凭证，请重新登录')
  await userStore.wxLogin(loginRes.code)
  return
  // #endif
  // #ifndef MP-WEIXIN
  throw new Error('请先在“我的”登录；浏览器不伪造微信登录凭证')
  // #endif
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
          const url = data?.url || data?.file_url || data?.image_url || data?.path || data?.data?.url || ''
          if (url) resolve(url)
          else reject(new Error('上传失败，未返回文件地址'))
        } catch {
          reject(new Error('上传响应解析失败'))
        }
      },
      fail: (err: any) => reject(new Error(err?.errMsg || '上传失败')),
    })
  })
}

async function runStyle() {
  if (busy.value || productionBusy.value) return
  if (!localImage.value) {
    capture()
    return
  }
  busy.value = true
  styleBusy.value = true
  designRevision.value = ''
  styledUrl.value = ''
  pod3dUrl.value = ''
  depthUrl.value = ''
  productionStatus.value = ''
  quotePoints.value = 0
  previewConfirmed.value = false
  notice.value = ''
  uni.showLoading({ title: 'AI风格处理中…' })
  try {
    await ensureLogin()
    const url = await uploadImage(localImage.value)
    let bgUrl: string | undefined
    if (template.value === 'custom') {
      if (!brandBgUrl.value) throw new Error('请先上传品牌背景图')
      bgUrl = await uploadImage(brandBgUrl.value)
    }
    const job: any = await api.photoJobs.create(url, template.value, bgUrl, templateTypeId.value || undefined)
    photoJobId.value = Number(job.id)
    photoJobStatus.value = job.status || 'uploaded'
    const res: any = await api.photoJobs.style(photoJobId.value)
    designRevision.value = res.design_revision || ''
    styledUrl.value = normalize(res.optimized_image_url || '')
    photoJobStatus.value = res.status || 'optimized'
    if (!styledUrl.value) throw new Error('未返回优化图')
    const runtime = res.runtime || {}
    const generative = runtime.is_generative_cartoon === true
    const layoutPreserved = runtime.quality_gate === 'layout_preserved'
    styleReadyForDepth.value = generative || (!layoutPreserved && Boolean(styledUrl.value))
    styleRuntimeLabel.value = `${layoutPreserved ? '输入质量门禁' : (generative ? '生成式卡通' : '本地图像处理')} · ${runtime.source || '来源未返回'}${runtime.mask_source ? ` · ${runtime.mask_source}` : ''}`
    styleRuntimeNote.value = layoutPreserved
      ? `${runtime.fallback_reason || '当前素材含复杂文字或版式，未进行生成式重绘。'} 请换一张正面人像照。`
      : generative
      ? '本次已调用 ComfyUI 图生图工作流，返回真实生成图片后才显示预览。'
      : `本次未完成生成式卡通，已使用本地图像处理：${runtime.fallback_reason || '返回了可预览图片'}。`
    notice.value = layoutPreserved
      ? '检测到复杂版式，已保真保留；请换正面人像再生成AI卡通。'
      : generative
      ? '生成式卡通效果已生成，可继续转2.5D。'
      : '本地图像处理效果已生成，尚非生成式卡通；请先核对效果。'
    if (!selectedTemplateType.value) showCustomization.value = true
    uni.showToast({ title: layoutPreserved ? '请换正面人像' : (generative ? '卡通效果已生成' : '本地效果已生成'), icon: layoutPreserved ? 'none' : 'success' })
  } catch (e: any) {
    styleRuntimeLabel.value = '调用失败，未生成可展示效果'
    styleRuntimeNote.value = '照片工具调用失败，页面不会展示伪造效果。'
    notice.value = `生成失败：${e?.message || '接口不可用'}`
    uni.showToast({ title: '生成失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
    busy.value = false
    styleBusy.value = false
  }
}

async function run25d() {
  if (!styledUrl.value) return
  busy.value = true
  depthBusy.value = true
  designRevision.value = ''
  notice.value = ''
  uni.showLoading({ title: '2.5D转换中…' })
  try {
    if (!photoJobId.value) throw new Error('照片任务未创建，请重新生成AI风格效果')
    const result: any = await api.photoJobs.preview25d(photoJobId.value)
    designRevision.value = result.design_revision || ''
    depthUrl.value = normalize(result.depth_url || '')
    pod3dUrl.value = normalize(result.pod3d_url || '')
    photoJobStatus.value = result.status || 'preview_ready'
    if (!depthUrl.value || !pod3dUrl.value) throw new Error('未生成完整2.5D预览')
    const runtime = result.runtime || {}
    const steps = Array.isArray(runtime.steps) ? runtime.steps.map((item: any) => `${item.name}:${item.source}`).join(' / ') : '来源未返回'
    depthRuntimeLabel.value = `${runtime.tool || '2.5D工作流'} · ${steps}`
    notice.value = '2.5D预览已生成；正式打样请到「工艺预检」上传照片生成加工包。'
    uni.showToast({ title: '2.5D预览已生成', icon: 'success' })
  } catch (e: any) {
    depthRuntimeLabel.value = '调用失败，未生成可展示效果'
    notice.value = `2.5D转换失败：${e?.message || '接口不可用'}`
    uni.showToast({ title: '2.5D转换失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    busy.value = false
    depthBusy.value = false
  }
}

function onMaterialChange(e: any) {
  if (productionBusy.value || busy.value) return
  materialIndex.value = Number(e.detail.value)
}

function onSizeChange(e: any) {
  if (productionBusy.value || busy.value) return
  sizeIndex.value = Number(e.detail.value)
}

function onProcessChange(e: any) {
  processIndex.value = Number(e.detail.value)
}

async function lockProduction() {
  if (!photoJobId.value || !styledUrl.value || !previewConfirmed.value || !artLoaded.value || !baseLoaded.value || !selectedTemplateType.value || busy.value || productionBusy.value) return
  productionBusy.value = true
  productionAction.value = 'lock'
  try {
    if (!/^[a-f0-9]{64}$/.test(designRevision.value) || !/^[a-f0-9]{64}$/.test(templateRevision.value)) {
      throw new Error('缺少设计版本，需重新读取并确认预览')
    }
    await ensureLogin()
    const result: any = await api.photoJobs.lockProduction(photoJobId.value, {
      expected_design_revision: designRevision.value,
      expected_template_revision: templateRevision.value,
      template_type_id: templateTypeId.value,
      product_type: 'inkjet',
      material_type: materialOptions[materialIndex.value],
      size: sizeOptions[sizeIndex.value],
      process: processOptions[processIndex.value],
      preview_confirmed: true,
    })
    lockedDesignSignature.value = designSignature.value
    designRevision.value = result.design_revision || ''
    productionStatus.value = result.production_status || 'awaiting_quote'
    quotePoints.value = Number(result.quote_points || 0)
    photoJobStatus.value = result.status || photoJobStatus.value
    notice.value = '询价设计已保存，等待门店确认价格与材料；尚未创建打印订单。'
    uni.showToast({ title: '已锁定设计', icon: 'success' })
  } catch (e: any) {
    previewConfirmed.value = false
    const jobId = photoJobId.value
    if (jobId) {
      await loadPhotoJob(jobId)
      await loadTemplateTypes()
    }
    notice.value = `未确认本次锁定成功：${e?.message || '接口不可用'}。已重新读取任务，请核对状态与预览，不会自动重复提交。`
    uni.showToast({ title: e?.message || '锁定失败', icon: 'none' })
  } finally {
    productionBusy.value = false
    productionAction.value = ''
  }
}

async function loadMachines() {
  if (productionBusy.value) return
  productionBusy.value = true
  productionAction.value = 'machines'
  try {
    const result: any = await api.machine.available('laser')
    machines.value = Array.isArray(result?.machines) ? result.machines : []
    machineIndex.value = 0
    selectedMachineId.value = machines.value[0]?.id ? Number(machines.value[0].id) : null
    machinesLoaded.value = true
    notice.value = machines.value.length ? `已读取 ${machines.value.length} 台可用设备。` : '当前没有已登记的在线设备。'
  } catch (e: any) {
    machinesLoaded.value = true
    notice.value = `设备读取失败：${e?.message || '接口不可用'}`
  } finally {
    productionBusy.value = false
    productionAction.value = ''
  }
}

function onMachineChange(e: any) {
  machineIndex.value = Number(e.detail.value)
  selectedMachineId.value = machines.value[machineIndex.value]?.id ? Number(machines.value[machineIndex.value].id) : null
}

async function submitProduction() {
  if (!photoJobId.value || !selectedMachineId.value || productionBusy.value) return
  productionBusy.value = true
  productionAction.value = 'submit'
  try {
    const result: any = await api.photoJobs.submitProduction(photoJobId.value, selectedMachineId.value)
    productionStatus.value = result.production_status || 'submitted'
    photoJobStatus.value = result.status || 'production_submitted'
    notice.value = result.message || '已提交设备处理队列。'
    uni.showToast({ title: '已提交生产', icon: 'success' })
  } catch (e: any) {
    // 409 的支付/备料门禁要直接展示给客户，不伪装成网络故障。
    notice.value = `生产暂不可提交：${e?.message || '请先完成支付与备料确认'}`
    uni.showToast({ title: '尚未满足生产条件', icon: 'none' })
  } finally {
    productionBusy.value = false
    productionAction.value = ''
  }
}

function openCraftReview() {
  if (!styledUrl.value) return
  try {
    const store = useAgentHandoffStore()
    store.setHandoff({
      path: '/pages/image25d/index',
      payload: {
        source_url: localImage.value,
        styled_url: styledUrl.value,
        depth_url: depthUrl.value,
        pod3d_url: pod3dUrl.value,
        template: template.value,
        photo_job_id: photoJobId.value,
        photo_job_status: photoJobStatus.value,
      },
    })
    uni.navigateTo({ url: '/pages/image25d/index' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '无法打开工艺预检', icon: 'none' })
  }
}

function saveWork() {
  const works = uni.getStorageSync('mock_25d_works') || []
  works.unshift({
    id: Date.now(),
    type: 'photobooth',
    title: 'AIGC拍照机 · AI风格大片',
    style: styles.find((item) => item.value === template.value)?.label || template.value,
    status: pod3dUrl.value ? '2.5D预览已生成' : 'AI风格效果已生成',
    source_url: localImage.value,
    styled_url: styledUrl.value,
    pod3d_url: pod3dUrl.value,
    depth_url: depthUrl.value,
    photo_job_id: photoJobId.value,
    photo_job_status: photoJobStatus.value,
    created_at: new Date().toLocaleString(),
  })
  uni.setStorageSync('mock_25d_works', works.slice(0, 20))
  uni.showToast({ title: '作品已保存', icon: 'success' })
}

function copyInfo() {
  const text = [
    '31度 AIGC互动拍照机 · 清凉夏日',
    'AI一键生成风格大片，转2.5D内雕、AI纪念币一人一币',
    `当前作品：${styledUrl.value || '未生成'}`,
    `2.5D预览：${pod3dUrl.value || '未生成'}`,
    '百场活动实拍：企业培训营 / 商务联谊 / 品牌周年 / 商场促销',
    '山东全区域：青岛/济南/潍坊/淄博/临沂…',
    '预订咨询：乐搜互动专业活动互动设备服务商',
  ].join('\n')
  uni.setClipboardData({
    data: text,
    success() {
      uni.showToast({ title: '活动信息已复制', icon: 'success' })
    },
  })
}

function contactFallback() {
  uni.showToast({ title: '真机微信可联系客服', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.booth-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 26rpx 26rpx 240rpx;
  background: linear-gradient(180deg, #0b2a3a 0%, #0b0d11 55%, #050505 100%);
  color: #f7f7f7;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 18rpx 0 22rpx;
}

.eyebrow {
  color: #5ec8ff;
  font-size: 22rpx;
  font-weight: 800;
}

.title {
  font-size: 46rpx;
  font-weight: 900;
}

.subtitle {
  color: rgba(255, 255, 255, 0.68);
  font-size: 23rpx;
  line-height: 1.5;
}

.camera-card {
  height: 430rpx;
  border-radius: 12rpx;
  border: 1rpx solid rgba(94, 200, 255, 0.3);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 18rpx;
}

.camera-image {
  width: 100%;
  height: 100%;
}

.camera-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  color: rgba(255, 255, 255, 0.6);
}

.camera-icon {
  font-size: 84rpx;
}

.product-card {
  padding: 20rpx;
  margin-bottom: 18rpx;
}

.customization-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 72rpx;
  color: $ink-muted;
  font-size: 24rpx;
}

.toggle-arrow {
  color: $brand-blue;
  font-size: 32rpx;
  line-height: 1;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
}

.product-chip {
  min-height: 104rpx;
  box-sizing: border-box;
  padding: 14rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.product-chip.active {
  background: rgba(94, 200, 255, 0.16);
  border-color: rgba(94, 200, 255, 0.6);
}

.product-type-image {
  display: block;
  width: 82rpx;
  height: 82rpx;
  margin-bottom: 8rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.9);
}

.product-name,
.product-meta,
.product-desc,
.product-note,
.product-empty {
  display: block;
}

.product-name {
  color: #fff;
  font-size: 25rpx;
  font-weight: 900;
}

.product-meta,
.product-desc,
.product-note,
.product-empty {
  color: rgba(255, 255, 255, 0.58);
  font-size: 20rpx;
  line-height: 1.45;
}

.product-desc {
  margin-top: 4rpx;
}

.product-note {
  margin-top: 12rpx;
  color: #bde8ff;
}

.product-empty {
  padding: 12rpx 0;
}

.camera-title {
  color: #fff;
  font-size: 30rpx;
  font-weight: 900;
}

.camera-desc {
  font-size: 21rpx;
}

.section,
.action-panel {
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.section {
  padding: 20rpx;
  margin-bottom: 18rpx;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.panel-title {
  color: #fff;
  font-size: 30rpx;
  font-weight: 900;
}

.panel-note {
  color: rgba(255, 255, 255, 0.5);
  font-size: 22rpx;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.style-chip {
  min-height: 92rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.style-chip.active {
  background: rgba(94, 200, 255, 0.16);
  border-color: rgba(94, 200, 255, 0.6);
}

.style-name {
  color: #fff;
  font-size: 24rpx;
  font-weight: 800;
}

.style-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 19rpx;
}

.brand-note {
  display: block;
  margin-top: 12rpx;
  color: #bde8ff;
  font-size: 21rpx;
  line-height: 1.5;
}

.action-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  padding: 16rpx;
  margin-bottom: 18rpx;
}

.primary-btn,
.ghost-btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 8rpx;
  font-size: 25rpx;
  font-weight: 900;
}

.primary-btn {
  background: #1e90ff;
  color: #fff;
}

.primary-btn.secondary {
  background: rgba(48, 209, 123, 0.2);
  color: #b8ffd0;
}

.primary-btn[disabled],
.ghost-btn[disabled] {
  opacity: 0.5;
}

.primary-btn::after,
.ghost-btn::after {
  border: none;
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.ghost-btn.accent {
  background: rgba(94, 200, 255, 0.16);
  color: #a8e0ff;
}

.result-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.result-card {
  min-height: 360rpx;
  border-radius: 8rpx;
  background: #141820;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-label {
  padding: 14rpx 16rpx;
  color: #fff;
  font-size: 23rpx;
  font-weight: 900;
}

.result-image {
  flex: 1;
  width: 100%;
  min-height: 280rpx;
  background: #0e1117;
}

.result-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 21rpx;
}

.product-preview-card {
  margin-bottom: 18rpx;
}

.preview-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
  margin-bottom: 14rpx;
}

.preview-tab {
  padding: 14rpx 10rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.58);
  text-align: center;
  font-size: 22rpx;
}

.preview-tab.active {
  background: rgba(94, 200, 255, 0.18);
  color: #bde8ff;
}

.product-preview-stage {
  min-height: 420rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: linear-gradient(145deg, #f4f7fb 0%, #d6dde8 100%);
  overflow: hidden;
}

.product-preview-stage.engraved {
  background: linear-gradient(145deg, #dfe5ee 0%, #8995a7 100%);
}

.product-mockup {
  position: relative;
  width: 100%;
  height: 420rpx;
  filter: drop-shadow(0 16rpx 20rpx rgba(7, 15, 27, 0.28));
}

.mockup-base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mockup-art-slot {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.2);
}

.mockup-art {
  width: 100%;
  height: 100%;
}

.mockup-phone .mockup-art-slot {
  left: 35.5%;
  top: 20.5%;
  width: 29%;
  height: 56%;
  border-radius: 12rpx;
}

.mockup-tshirt .mockup-art-slot {
  left: 36%;
  top: 39%;
  width: 28%;
  height: 24%;
}

.mockup-crystal .mockup-art-slot {
  left: 22%;
  top: 27%;
  width: 56%;
  height: 46%;
  opacity: 0.9;
}

.mockup-metal .mockup-art-slot {
  left: 25.5%;
  top: 39%;
  width: 49%;
  height: 21%;
  border-radius: 6rpx;
  opacity: 0.88;
}

.mockup-wood .mockup-art-slot {
  left: 27%;
  top: 34%;
  width: 46%;
  height: 24%;
  border-radius: 10rpx;
  opacity: 0.9;
}

.product-preview-title,
.product-preview-note {
  display: block;
}

.product-preview-title {
  margin-top: 14rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 800;
}

.product-preview-note {
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.55);
  font-size: 21rpx;
  line-height: 1.5;
}

.runtime-card {
  margin-bottom: 18rpx;
}

.runtime-line,
.runtime-note {
  display: block;
  line-height: 1.55;
}

.runtime-line {
  margin-top: 8rpx;
  color: #d7e7f5;
  font-size: 22rpx;
}

.runtime-note {
  margin-top: 12rpx;
  color: rgba(255, 255, 255, 0.52);
  font-size: 20rpx;
}

.notice {
  display: block;
  padding: 16rpx;
  margin-bottom: 18rpx;
  border-radius: 8rpx;
  background: rgba(94, 200, 255, 0.1);
  color: #bde8ff;
  font-size: 22rpx;
  line-height: 1.5;
}

.production-card {
  border-color: rgba(245, 190, 76, 0.28);
}

.title-bar.gold {
  background: #f5be4c;
}

.production-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.production-field {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 14rpx;
  min-height: 76rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.62);
  font-size: 20rpx;
}

.field-value {
  color: #fff;
  font-size: 21rpx;
  font-weight: 800;
}

.production-status,
.production-gate {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin: 12rpx 0;
  color: #f8ddb0;
  font-size: 21rpx;
  line-height: 1.5;
}

.machine-picker {
  margin: 10rpx 0;
}

.machine-empty {
  color: rgba(255, 255, 255, 0.55);
}
</style>
