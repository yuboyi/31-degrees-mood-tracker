<template>
  <view class="sample-page">
    <view class="hero">
      <text class="eyebrow">Proofing order</text>
      <text class="title">提交打样</text>
      <text class="subtitle">把已生成的灰度图和2.5D预览交给打样人员确认，后续可接后台订单和PC热文件夹。</text>
    </view>

    <view v-if="work" class="work-card">
      <view class="work-main">
        <image v-if="work.depth_url || work.pod3d_url || work.source_url" class="work-thumb" :src="work.depth_url || work.pod3d_url || work.source_url" mode="aspectFit" />
      <view class="work-copy">
        <text class="work-title">{{ work.title || '2.5D内雕作品' }}</text>
        <text class="work-meta">{{ work.status || '待确认' }} · 任务 #{{ work.task_id || '-' }}</text>
      </view>
    </view>
      <text v-if="work.local_preview_package" class="local-preview-note">
        当前作品来自本机测试预览包，只能进入人工复核；正式 BMP/STL/设备文件需后端或 PC 客户端重新生成。
      </text>
      <text class="work-note">提交前会带上工艺预检结论；低风险进入真实加工订单，高风险先转人工复核。</text>
    </view>

    <view v-else class="work-card">
      <text class="work-title">未选择作品</text>
      <text class="work-note">请先在图转2.5D页面生成灰度图和2.5D预览。</text>
    </view>

    <view v-if="craftAssessment" class="assessment-panel" :class="assessmentToneClass">
      <view class="assessment-head">
        <view>
          <text class="section-title">工艺预检结论</text>
          <text class="assessment-subtitle">风险分 {{ craftAssessment.risk_score }}/100 · {{ craftAssessment.recommended_process || craft }}</text>
        </view>
        <text class="assessment-badge">{{ assessmentBadgeText }}</text>
      </view>

      <view class="assessment-grid">
        <view v-for="item in assessmentMetricCards" :key="item.label" class="assessment-metric">
          <text class="label">{{ item.label }}</text>
          <text class="value">{{ item.value }}</text>
        </view>
      </view>

      <view class="assessment-risk-list">
        <view v-for="item in assessmentRiskItems" :key="item.code" class="assessment-risk-item" :class="item.severity">
          <text class="label">{{ item.label }}</text>
          <text class="suggestion">{{ item.suggestion || item.advice }}</text>
        </view>
      </view>

      <text v-if="manualReviewRequired" class="review-warning">此单不会直接下发设备，先进入人工复核队列。</text>
    </view>

    <view class="form-section">
      <text class="section-title">材料</text>
      <view class="chip-grid">
        <view v-for="item in materials" :key="item" class="chip" :class="{ active: material === item }" @tap="material = item">{{ item }}</view>
      </view>
    </view>

    <view class="form-section">
      <text class="section-title">尺寸</text>
      <view class="chip-grid">
        <view v-for="item in sizes" :key="item" class="chip" :class="{ active: size === item }" @tap="size = item">{{ item }}</view>
      </view>
    </view>

    <view class="form-section">
      <text class="section-title">工艺</text>
      <view class="chip-grid">
        <view v-for="item in crafts" :key="item" class="chip" :class="{ active: craft === item }" @tap="craft = item">{{ item }}</view>
      </view>
    </view>

    <view class="form-section">
      <text class="section-title">联系信息</text>
      <input v-model="contact" class="input" type="text" placeholder="手机号/微信/客户名，便于打样人员回访" />
      <textarea v-model="remark" class="textarea" maxlength="160" placeholder="备注：用途、数量、交期、是否需要真实内雕机打样等" />
    </view>

    <view class="machine-panel">
      <view class="machine-title-row">
        <text class="section-title">{{ manualReviewRequired ? '复核方式' : '接收设备' }}</text>
        <button v-if="!manualReviewRequired && machineError" class="mini-retry" @tap="loadAvailableMachine">重试</button>
      </view>
      <view v-if="manualReviewRequired" class="machine-card review">
        <text class="machine-name">人工复核队列</text>
        <text class="machine-meta">先确认细线、刀面起伏、材料和尺寸，不直接投递PC端热文件夹。</text>
      </view>
      <template v-else>
        <view v-if="machineLoading" class="machine-state">正在查找在线设备...</view>
        <view v-else-if="selectedMachine" class="machine-card">
          <text class="machine-name">{{ selectedMachine.name || '31度加工测试机' }}</text>
          <text class="machine-meta">{{ selectedMachine.machine_type || '激光内雕机' }} · {{ selectedMachine.status || 'online' }}</text>
        </view>
        <view v-else class="machine-state error">{{ machineError || '暂无在线设备，暂不能提交真实加工订单' }}</view>
      </template>
    </view>

    <view v-if="submitError" class="error-panel">
      <text>{{ submitError }}</text>
      <button class="mini-retry" @tap="submitProof">重新提交</button>
    </view>

    <view class="flow-panel">
      <view v-for="item in flowSteps" :key="item" class="flow-item">
        <text class="flow-dot"></text>
        <text>{{ item }}</text>
      </view>
    </view>

    <view class="action-panel">
      <button class="primary-btn" :class="{ review: manualReviewRequired }" :disabled="!canSubmit" :loading="submitBusy" @tap="submitProof">{{ submitButtonText }}</button>
      <button class="ghost-btn" @tap="copyProofInfo">复制打样信息</button>
      <button class="ghost-btn" open-type="contact" @tap="contactFallback">联系客服</button>
      <button class="ghost-btn" @tap="goImage25d">继续生成</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api } from '@/api'

const work = ref<any | null>(null)
const material = ref('水晶')
const size = ref('80x80x80mm')
const craft = ref('内雕灰度图')
const contact = ref('')
const remark = ref('')
const selectedMachine = ref<any | null>(null)
const machineLoading = ref(false)
const machineError = ref('')
const submitBusy = ref(false)
const submitError = ref('')
const lastOrder = ref<any | null>(null)

const materials = ['水晶', '亚克力', '金属', '木质', '皮革', '玻璃']
const sizes = ['50x50x50mm', '80x80x80mm', '100x100x50mm', 'A5', 'A4', '自定义']
const crafts = ['内雕灰度图', '2.5D浮雕预览', '点阵打标', '线稿打标', '人工复核']
const craftAssessment = computed(() => work.value?.craft_assessment || null)
const manualReviewRequired = computed(() => !!work.value?.local_preview_package || !!craftAssessment.value?.manual_review_required || craft.value === '人工复核')
const assessmentRiskItems = computed(() => craftAssessment.value?.risk_items || [])
const assessmentToneClass = computed(() => {
  if (!craftAssessment.value) return ''
  if (craftAssessment.value.grade === 'review') return 'tone-danger'
  if (craftAssessment.value.grade === 'warn') return 'tone-warn'
  return 'tone-pass'
})
const assessmentBadgeText = computed(() => {
  if (!craftAssessment.value) return '未预检'
  if (craftAssessment.value.grade === 'review') return '需人工复核'
  if (craftAssessment.value.grade === 'warn') return '可打样但需优化'
  return '可进入打样'
})
const assessmentMetricCards = computed(() => {
  const metrics = craftAssessment.value?.metrics || {}
  return [
    { label: '线条密度', value: formatPercent(metrics.edge_density) },
    { label: '陡峭起伏', value: formatPercent(metrics.high_edge_ratio) },
    { label: '最小线宽', value: formatMm(metrics.estimated_min_line_mm) },
    { label: '灰度反差', value: String(metrics.contrast ?? '-') },
  ]
})
const flowSteps = computed(() => (
  manualReviewRequired.value
    ? ['客户/销售提交', 'AI预检风险确认', '技术人工复核', '优化文件包', '确认后再投设备']
    : ['客户/销售提交', 'AI工艺预检通过', '确认材料尺寸', 'PC端接收文件', '热文件夹/设备加工']
))
const canSubmit = computed(() => !!work.value && !submitBusy.value && (manualReviewRequired.value || !!selectedMachine.value))
const submitButtonText = computed(() => {
  if (submitBusy.value) return '提交中...'
  return manualReviewRequired.value ? '提交人工复核' : '提交真实加工订单'
})

onLoad((query: any) => {
  loadWork(query?.workId || query?.id)
  restoreDraft()
})

onShow(() => {
  loadAvailableMachine()
  uni.showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  } as any)
})

function loadWork(id?: string | number) {
  const works = readList('mock_25d_works')
  work.value = id ? works.find((item: any) => String(item.id) === String(id)) : works[0]
  if (!work.value) return
  material.value = work.value.material || material.value
  size.value = work.value.size || size.value
  craft.value = work.value.local_preview_package || work.value.manual_review_required ? '人工复核' : work.value.craft || work.value.recommended_process || craft.value
}

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

function readList(key: string) {
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

function buildProofRecord() {
  const assessment = craftAssessment.value
  return {
    id: Date.now(),
    work_id: work.value?.id == null ? undefined : String(work.value.id),
    title: work.value?.title || '2.5D内雕打样',
    material: material.value,
    size: size.value,
    craft: craft.value,
    contact: contact.value.trim(),
    remark: remark.value.trim(),
    status: manualReviewRequired.value ? '待人工复核' : '待打样人员确认',
    craft_assessment: assessment,
    craft_job_id: assessment?.job_id || work.value?.craft_job_id || '',
    craft_risk_score: assessment?.risk_score ?? work.value?.craft_risk_score ?? null,
    craft_grade: assessment?.grade || work.value?.craft_grade || '',
    manual_review_required: manualReviewRequired.value,
    local_preview_package: !!work.value?.local_preview_package,
    processing_fallback_reason: work.value?.processing_fallback_reason || '',
    output_mode: work.value?.output_mode || (work.value?.local_preview_package ? 'local-preview-only' : 'backend-generated'),
    recommended_process: assessment?.recommended_process || work.value?.recommended_process || craft.value,
    risk_image_url: assessment?.risk_image_url || work.value?.risk_image_url || '',
    assessment_source: assessment?.source || work.value?.assessment_source || '',
    source_url: work.value?.source_url || '',
    depth_url: work.value?.depth_url || '',
    pod3d_url: work.value?.pod3d_url || '',
    bmp_url: work.value?.bmp_url || '',
    z_gcode_url: work.value?.z_gcode_url || '',
    stl_url: work.value?.stl_url || '',
    machine_profile_url: work.value?.machine_profile_url || '',
    guide_url: work.value?.guide_url || '',
    gcode_url: work.value?.gcode_url || '',
    task_id: work.value?.task_id == null ? '' : String(work.value.task_id),
    machine_id: selectedMachine.value?.id || '',
    machine_name: selectedMachine.value?.name || '',
    backend_order_id: lastOrder.value?.order_id || '',
    created_at: new Date().toLocaleString(),
  }
}

function draftKey() {
  return `sample_submit_draft_${work.value?.id || 'latest'}`
}

function saveDraft() {
  if (!work.value) return
  uni.setStorageSync(draftKey(), {
    material: material.value,
    size: size.value,
    craft: craft.value,
    contact: contact.value,
    remark: remark.value,
    updated_at: new Date().toLocaleString(),
  })
}

function restoreDraft() {
  const draft = uni.getStorageSync(draftKey())
  if (!draft) return
  material.value = draft.material || material.value
  size.value = draft.size || size.value
  craft.value = draft.craft || craft.value
  contact.value = draft.contact || contact.value
  remark.value = draft.remark || remark.value
}

watch([material, size, craft, contact, remark], saveDraft)

async function ensureLogin() {
  const token = uni.getStorageSync('token')
  if (token) return
  try {
    const loginRes: any = await uni.login()
    const res: any = await api.auth.wxLogin(loginRes?.code || `h5-${Date.now()}`)
    if (res?.token) uni.setStorageSync('token', res.token)
  } catch {
    const res: any = await api.auth.wxLogin(`h5-${Date.now()}`)
    if (res?.token) uni.setStorageSync('token', res.token)
  }
}

async function loadAvailableMachine() {
  if (manualReviewRequired.value) {
    selectedMachine.value = null
    machineError.value = ''
    machineLoading.value = false
    return
  }
  machineLoading.value = true
  machineError.value = ''
  try {
    await ensureLogin()
    const res: any = await api.machine.available('激光内雕机')
    const machines = res?.machines || []
    selectedMachine.value = machines.find((item: any) => item.status !== 'offline') || machines[0] || null
    if (!selectedMachine.value) machineError.value = '暂无在线内雕/激光设备，请先在后台注册测试机'
  } catch (e: any) {
    selectedMachine.value = null
    machineError.value = e?.message || '设备查询失败'
  } finally {
    machineLoading.value = false
  }
}

function buildMachineOrderPayload() {
  const record = buildProofRecord()
  const sourceUrl = normalizeProcessingUrl(record.source_url || record.depth_url || record.pod3d_url)
  const depthUrl = normalizeProcessingUrl(record.depth_url)
  const bmpUrl = normalizeProcessingUrl(record.bmp_url)
  const pod3dUrl = normalizeProcessingUrl(record.pod3d_url)
  const zGcodeUrl = normalizeProcessingUrl(record.z_gcode_url)
  const stlUrl = normalizeProcessingUrl(record.stl_url)
  const profileUrl = normalizeProcessingUrl(record.machine_profile_url)
  const guideUrl = normalizeProcessingUrl(record.guide_url)
  const gcodeUrl = normalizeProcessingUrl(record.gcode_url)
  return {
    machine_id: selectedMachine.value.id,
    source_image_url: sourceUrl,
    ai_processing_type: 'original',
    material_type: mapMaterialType(material.value),
    gift_message: `${record.size} / ${record.craft}`,
    engraving_params: {
      product_line: 'inner_engraving_2_5d',
      proof_record: {
        ...record,
        source_url: sourceUrl,
        depth_url: depthUrl,
        bmp_url: bmpUrl,
        pod3d_url: pod3dUrl,
        z_gcode_url: zGcodeUrl,
        stl_url: stlUrl,
        machine_profile_url: profileUrl,
        guide_url: guideUrl,
        gcode_url: gcodeUrl,
      },
      job_package: {
        source_url: sourceUrl,
        depth_url: depthUrl,
        bmp_url: bmpUrl,
        pod3d_url: pod3dUrl,
        z_gcode_url: zGcodeUrl,
        stl_url: stlUrl,
        machine_profile_url: profileUrl,
        guide_url: guideUrl,
        gcode_url: gcodeUrl,
      },
      safety: {
        max_depth_mm: work.value?.machine_profile?.z_axis?.max_depth_mm || 1.2,
        scan_step_mm: work.value?.machine_profile?.raster?.scan_step_mm || 0.2,
        assessment_gate: {
          manual_review_required: record.manual_review_required,
          risk_score: record.craft_risk_score,
          grade: record.craft_grade,
          recommended_process: record.recommended_process,
          risk_items: record.craft_assessment?.risk_items || [],
          source: record.assessment_source,
        },
        note: '现场加工前必须由打样人员确认材料、焦距、功率和设备软件格式',
      },
    },
    deduction_mode: 'store',
  }
}

function normalizeProcessingUrl(url?: string) {
  if (!url) return ''
  return String(url)
    .replace('/uploads/processed/', '/processed/')
    .replace('http://localhost:8000/uploads/processed/', 'http://localhost:8000/processed/')
    .replace('http://127.0.0.1:8000/uploads/processed/', 'http://127.0.0.1:8000/processed/')
}

function mapMaterialType(value: string) {
  const map: Record<string, string> = {
    水晶: 'crystal',
    亚克力: 'acrylic',
    金属: 'metal',
    木质: 'wood',
    皮革: 'leather',
    玻璃: 'glass',
  }
  return map[value] || value
}

async function submitProof() {
  if (!work.value) {
    uni.showToast({ title: '请先选择作品', icon: 'none' })
    return
  }
  if (!contact.value.trim()) {
    uni.showToast({ title: '请填写联系信息', icon: 'none' })
    return
  }

  if (manualReviewRequired.value) {
    submitBusy.value = true
    submitError.value = ''
    const orders = readList('mock_sample_orders')

    try {
      await ensureLogin()
      const record = {
        ...buildProofRecord(),
        status: '待人工复核',
        review_reason:
          assessmentRiskItems.value.map((item: any) => item.label).join('、') || '预检要求人工确认',
      }
      const backend = await api.proofing.create({
        ...record,
        manual_review_required: true,
        craft_assessment: record.craft_assessment || undefined,
      })
      record.backend_order_id = backend?.order?.id || ''
      record.status = backend?.order?.status || record.status
      orders.unshift(record)
      uni.setStorageSync('mock_sample_orders', orders.slice(0, 50))
      uni.removeStorageSync(draftKey())
      uni.showModal({
        title: '已提交人工复核',
        content: `复核单 #${record.backend_order_id || '-'} 已进入后台，待技术确认后再投递设备。`,
        confirmText: '知道了',
        showCancel: false,
      })
    } catch (e: any) {
      const record = {
        ...buildProofRecord(),
        status: '提交失败-本地草稿',
        review_reason:
          assessmentRiskItems.value.map((item: any) => item.label).join('、') || '预检要求人工确认',
      }
      orders.unshift(record)
      uni.setStorageSync('mock_sample_orders', orders.slice(0, 50))
      saveDraft()
      submitError.value = e?.message || '提交复核失败，已保存本地草稿'
      uni.showToast({ title: submitError.value, icon: 'none' })
    } finally {
      submitBusy.value = false
    }
    return
  }

  if (!selectedMachine.value) {
    await loadAvailableMachine()
    if (!selectedMachine.value) {
      submitError.value = machineError.value || '暂无在线设备，无法提交真实加工订单'
      saveDraft()
      return
    }
  }
  submitBusy.value = true
  submitError.value = ''
  const orders = readList('mock_sample_orders')
  try {
    await ensureLogin()
    const payload = buildMachineOrderPayload()
    const res: any = await api.machine.createOrder(payload)
    lastOrder.value = res
    const record = { ...buildProofRecord(), backend_order_id: res?.order_id, status: res?.status || 'pending' }
    orders.unshift(record)
    uni.setStorageSync('mock_sample_orders', orders.slice(0, 50))
    uni.removeStorageSync(draftKey())
    uni.showModal({
      title: '已提交加工订单',
      content: `订单 #${res?.order_id || '-'} 已进入后台，PC接收端可拉取文件包。`,
      confirmText: '知道了',
      showCancel: false,
    })
  } catch (e: any) {
    const record = { ...buildProofRecord(), status: '提交失败-本地草稿' }
    orders.unshift(record)
    uni.setStorageSync('mock_sample_orders', orders.slice(0, 50))
    saveDraft()
    submitError.value = e?.message || '提交失败，已保存本地草稿'
    uni.showToast({ title: submitError.value, icon: 'none' })
  } finally {
    submitBusy.value = false
  }
}

function copyProofInfo() {
  if (!work.value) return
  const record = buildProofRecord()
  const assessment = record.craft_assessment
  const riskSummary =
    assessment?.risk_items?.map((item: any) => `${item.label}:${item.suggestion || item.advice || '-'}`).join('；') || '-'
  const text = [
    `打样作品：${record.title}`,
    `材料：${record.material}`,
    `尺寸：${record.size}`,
    `工艺：${record.craft}`,
    `预检结论：${assessmentBadgeText.value}`,
    `风险分：${record.craft_risk_score ?? '-'}/100`,
    `人工复核：${record.manual_review_required ? '是' : '否'}`,
    `输出模式：${record.output_mode || '-'}`,
    `本机预览原因：${record.processing_fallback_reason || '-'}`,
    `推荐路径：${record.recommended_process || '-'}`,
    `风险点：${riskSummary}`,
    `风险热区图：${record.risk_image_url || '-'}`,
    `预检报告：${assessment?.report_url || '-'}`,
    `联系：${record.contact || '-'}`,
    `备注：${record.remark || '-'}`,
    `灰度图：${record.depth_url || '-'}`,
    `2.5D预览：${record.pod3d_url || '-'}`,
  ].join('\n')
  uni.setClipboardData({
    data: text,
    success() {
      uni.showToast({ title: '打样信息已复制', icon: 'success' })
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
      title: '31度2.5D内雕打样确认',
      path: '/pages/sample/submit',
    }
  },
}
</script>

<style lang="scss" scoped>
.sample-page {
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
  font-size: 44rpx;
  font-weight: 900;
}

.subtitle,
.work-note {
  color: rgba(255, 255, 255, 0.64);
  font-size: 24rpx;
  line-height: 1.5;
}

.work-card,
.assessment-panel,
.form-section,
.flow-panel,
.machine-panel,
.error-panel,
.action-panel {
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8rpx;
}

.work-card {
  padding: 18rpx;
  margin-bottom: 18rpx;
}

.assessment-panel {
  padding: 20rpx;
  margin-bottom: 18rpx;
}

.assessment-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.assessment-subtitle {
  display: block;
  margin-top: 6rpx;
  color: rgba(255, 255, 255, 0.62);
  font-size: 23rpx;
  line-height: 1.45;
}

.assessment-badge {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.assessment-panel.tone-pass .assessment-badge {
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.14);
}

.assessment-panel.tone-warn .assessment-badge {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.16);
}

.assessment-panel.tone-danger .assessment-badge {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.2);
}

.assessment-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.assessment-metric {
  min-width: 0;
  padding: 16rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.07);
}

.assessment-metric .label {
  display: block;
  color: rgba(255, 255, 255, 0.52);
  font-size: 21rpx;
}

.assessment-metric .value {
  display: block;
  margin-top: 8rpx;
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
  word-break: break-all;
}

.assessment-risk-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 16rpx;
}

.assessment-risk-item {
  padding: 16rpx;
  border-radius: 8rpx;
  border-left: 8rpx solid rgba(147, 197, 253, 0.9);
  background: rgba(255, 255, 255, 0.06);
}

.assessment-risk-item.high {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.14);
}

.assessment-risk-item.medium {
  border-left-color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}

.assessment-risk-item.low {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.assessment-risk-item .label {
  display: block;
  color: #fff;
  font-size: 25rpx;
  font-weight: 900;
}

.assessment-risk-item .suggestion {
  display: block;
  margin-top: 6rpx;
  color: rgba(255, 255, 255, 0.66);
  font-size: 23rpx;
  line-height: 1.5;
}

.review-warning {
  display: block;
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 8rpx;
  color: #fecaca;
  background: rgba(239, 68, 68, 0.14);
  font-size: 24rpx;
  line-height: 1.5;
}

.work-main {
  display: flex;
  gap: 18rpx;
  align-items: center;
  margin-bottom: 14rpx;
}

.work-thumb {
  width: 128rpx;
  height: 128rpx;
  border-radius: 8rpx;
  background: rgba(0, 0, 0, 0.25);
}

.work-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.work-title {
  font-size: 30rpx;
  font-weight: 800;
}

.work-meta {
  color: rgba(255, 255, 255, 0.6);
  font-size: 23rpx;
}

.local-preview-note {
  display: block;
  margin: 0 0 12rpx;
  padding: 14rpx;
  border-radius: 8rpx;
  background: rgba(245, 158, 11, 0.14);
  color: #fed7aa;
  font-size: 23rpx;
  line-height: 1.45;
}

.form-section {
  padding: 20rpx;
  margin-bottom: 18rpx;
}

.section-title {
  display: block;
  margin-bottom: 14rpx;
  font-size: 28rpx;
  font-weight: 800;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.chip {
  min-height: 70rpx;
  box-sizing: border-box;
  padding: 16rpx 12rpx;
  border-radius: 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.78);
  text-align: center;
  font-size: 24rpx;
  font-weight: 700;
  word-break: break-all;
}

.chip.active {
  border-color: rgba(255, 90, 76, 0.8);
  background: rgba(164, 35, 38, 0.46);
  color: #fff;
}

.input,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 8rpx;
  background: rgba(0, 0, 0, 0.24);
  color: #fff;
  font-size: 25rpx;
}

.input {
  height: 76rpx;
  padding: 0 18rpx;
  margin-bottom: 14rpx;
}

.textarea {
  min-height: 150rpx;
  padding: 18rpx;
  line-height: 1.5;
}

.flow-panel {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 20rpx;
  margin-bottom: 18rpx;
}

.flow-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: rgba(255, 255, 255, 0.72);
  font-size: 24rpx;
}

.flow-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #30d17b;
}

.machine-panel,
.error-panel {
  padding: 20rpx;
  margin-bottom: 18rpx;
}

.machine-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.machine-card {
  border-radius: 8rpx;
  background: rgba(48, 209, 123, 0.12);
  border: 1rpx solid rgba(48, 209, 123, 0.24);
  padding: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.machine-card.review {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.28);
}

.machine-name {
  color: #fff;
  font-size: 26rpx;
  font-weight: 900;
}

.machine-meta,
.machine-state {
  color: rgba(255, 255, 255, 0.66);
  font-size: 23rpx;
  line-height: 1.5;
}

.machine-state.error,
.error-panel {
  color: #ffb0a8;
}

.error-panel {
  background: rgba(226, 58, 61, 0.14);
  border-color: rgba(226, 58, 61, 0.32);
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.mini-retry {
  height: 56rpx;
  line-height: 56rpx;
  margin: 0;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
}

.mini-retry::after {
  border: none;
}

.action-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
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

.primary-btn.review {
  background: linear-gradient(135deg, #f97316, #e23a3d);
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
</style>
