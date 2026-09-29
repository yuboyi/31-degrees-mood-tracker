<template>
  <view class="ai-page">
    <!-- 蓝色系 Hero -->
    <view class="hero">
      <view class="hero-orb orb-a"></view>
      <view class="hero-orb orb-b"></view>
      <text class="eyebrow">AI 2.5D 内雕</text>
      <text class="title">文生2.5D</text>
      <text class="subtitle">输入画面描述，生成 2D 草图后再转成适合水晶内雕确认的 2.5D 预览。</text>
      <view class="hero-badge">文字生图为辅助入口 · 服务状态以实际结果为准</view>
    </view>

    <view class="body">
      <!-- 描述输入 -->
      <view class="card">
        <view class="section-title">
          <view class="title-bar blue"></view>
          <text class="title-text">图片描述</text>
          <text class="counter">{{ prompt.length }}/120</text>
        </view>
        <textarea
          v-model="prompt"
          class="prompt-input"
          maxlength="120"
          placeholder="例：一只坐在星空下的小猫，适合水晶内雕，主体清晰，背景简洁"
        />
        <view class="example-list">
          <text
            v-for="item in examples"
            :key="item"
            class="example-chip"
            @tap="useExample(item)"
          >
            {{ item }}
          </text>
        </view>
      </view>

      <!-- 风格选择 -->
      <view class="card">
        <view class="section-title">
          <view class="title-bar blue"></view>
          <text class="title-text">风格</text>
        </view>
        <view class="style-grid">
          <view
            v-for="item in styles"
            :key="item.value"
            class="style-chip"
            :class="{ active: style === item.value }"
            @tap="style = item.value"
          >
            <view class="style-dot" :class="'dot-' + item.value"></view>
            <view class="style-copy">
              <text class="style-name">{{ item.label }}</text>
              <text class="style-desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 生成流程 -->
      <view class="card">
        <view class="section-title">
          <view class="title-bar blue"></view>
          <text class="title-text">生成流程</text>
        </view>
        <view class="pipeline">
          <view v-for="item in pipeline" :key="item.label" class="pipeline-step" :class="{ active: item.active, done: item.done }">
            <view class="step-dot"></view>
            <text class="step-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 结果双卡 -->
      <view class="card">
        <view class="section-title">
          <view class="title-bar blue"></view>
          <text class="title-text">生成结果</text>
        </view>
        <view class="result-board">
          <view class="result-card">
            <text class="result-label">2D 生成图</text>
            <view class="mock-canvas" :class="{ ready: generated2d }">
              <image v-if="imageUrl" class="result-img" :src="imageUrl" mode="aspectFit" />
              <text v-else-if="status === 'generating'" class="state-text">生成中 {{ progress }}%</text>
              <text v-else class="state-text">等待生成</text>
            </view>
          </view>

          <view class="result-card">
            <text class="result-label">2.5D 内雕预览</text>
            <view class="mock-canvas depth" :class="{ ready: depthReady }">
              <image v-if="pod3dUrl" class="result-img" :src="pod3dUrl" mode="aspectFit" />
              <text v-else-if="converting" class="state-text">转换中 {{ progress }}%</text>
              <text v-else class="state-text">生成 2D 后可转换</text>
            </view>
          </view>
        </view>

        <view v-if="depthUrl" class="depth-row">
          <text class="depth-label">灰度深度图（内雕层次）</text>
          <image class="depth-img" :src="depthUrl" mode="aspectFit" />
        </view>
      </view>

      <!-- 主 / 次按钮 -->
      <view class="action-main">
        <button class="btn-primary" :disabled="busy" @tap="generate2d">
          {{ status === 'generating' ? '生成中' : '生成 2D 草图' }}
        </button>
        <button class="btn-secondary" :disabled="!generated2d || busy" @tap="convertTo25d">
          {{ converting ? '转换中' : '转 2.5D' }}
        </button>
      </view>

      <text v-if="notice" class="notice">{{ notice }}</text>

      <!-- 操作按钮组 -->
      <view class="action-row">
        <button class="ghost-btn" :disabled="!depthReady" @tap="saveWork">保存作品</button>
        <button class="ghost-btn" @tap="goImage25d">生成加工包</button>
        <button class="ghost-btn" open-type="contact" @tap="contactFallback">联系客服</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, getApiBaseUrl } from '@/api'
import { useUserStore } from '@/stores/user'
import { useAgentHandoffStore } from '@/stores/agentHandoff'

const userStore = useUserStore()
const prompt = ref('')
const style = ref('crystal')
const status = ref<'idle' | 'generating' | 'generated' | 'failed'>('idle')
const converting = ref(false)
const generated2d = ref(false)
const depthReady = ref(false)
const progress = ref(0)
const imageUrl = ref('')
const depthUrl = ref('')
const pod3dUrl = ref('')
const notice = ref('')

const styles = [
  { value: 'crystal', label: '水晶内雕', desc: '主体清晰' },
  { value: 'portrait', label: '人物肖像', desc: '层次柔和' },
  { value: 'product', label: '产品展示', desc: '轮廓明确' },
  { value: 'logo', label: 'Logo 线稿', desc: '适合打标' },
]

const examples = [
  '卡通人物头像，主体清晰，适合水晶内雕',
  '客户照片做纪念摆件，背景简洁，脸部层次柔和',
  '公司logo做透明水晶奖杯，线条清楚',
]

const selectedStyleLabel = computed(() => styles.find(item => item.value === style.value)?.label || '水晶内雕')
const busy = computed(() => status.value === 'generating' || converting.value)

const pipeline = computed(() => [
  { label: '输入描述', active: !generated2d.value, done: prompt.value.trim().length > 0 },
  { label: '生成 2D', active: status.value === 'generating', done: generated2d.value },
  { label: '转深度图', active: converting.value, done: depthReady.value },
  { label: '保存/下单', active: depthReady.value, done: false },
])

onShow(() => {
  uni.showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  } as any)
  consumeAgentHandoff()
})

function consumeAgentHandoff() {
  try {
    const store = useAgentHandoffStore()
    if (!store.hasHandoff || !store.payload) return
    const p: any = store.payload
    if (p.image_url) imageUrl.value = normalize(p.image_url)
    if (p.depth_url) depthUrl.value = normalize(p.depth_url)
    if (p.pod3d_url) pod3dUrl.value = normalize(p.pod3d_url)
    if (p.prompt) prompt.value = String(p.prompt)
    if (p.style) style.value = String(p.style)
    generated2d.value = !!imageUrl.value
    depthReady.value = !!depthUrl.value && !!pod3dUrl.value
    notice.value = '已载入微信AI生成的文生2.5D结果，可继续生成加工包。'
    store.consumeHandoff()
  } catch {
    // 忽略异常
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runMockProgress(start = 15) {
  progress.value = start
  for (const value of [32, 48, 66, 82, 100]) {
    await sleep(220)
    progress.value = value
  }
}

function normalize(url: string) {
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

async function ensureLogin() {
  userStore.restoreLogin()
  if (userStore.isLogin) return
  try {
    const loginRes: any = await uni.login()
    await userStore.wxLogin(loginRes?.code || `h5-${Date.now()}`)
  } catch {
    try {
      await userStore.wxLogin(`h5-${Date.now()}`)
    } catch {
      // 后端不可用时会在生成阶段报错
    }
  }
}

async function generate2d() {
  if (!prompt.value.trim()) {
    uni.showToast({ title: '先输入图片描述', icon: 'none' })
    return
  }
  status.value = 'generating'
  generated2d.value = false
  depthReady.value = false
  imageUrl.value = ''
  depthUrl.value = ''
  pod3dUrl.value = ''
  notice.value = ''
  uni.showLoading({ title: '本地AI生成中…' })
  runMockProgress(8)
  try {
    await ensureLogin()
    const res: any = await api.processing.textTo25d({
      prompt: prompt.value.trim(),
      style: style.value,
      width: 512,
      height: 512,
      steps: 2,
    })
    imageUrl.value = normalize(res.image_url || '')
    depthUrl.value = normalize(res.depth_url || '')
    pod3dUrl.value = normalize(res.pod3d_url || '')
    generated2d.value = !!imageUrl.value
    depthReady.value = !!depthUrl.value && !!pod3dUrl.value
    status.value = generated2d.value ? 'generated' : 'failed'
    notice.value = res.warning || (depthReady.value ? '已生成 2D图 + 深度图 + 2.5D预览。' : '2D图已生成；深度图暂不可用。')
    progress.value = 100
    uni.showToast({ title: generated2d.value ? '生成成功' : '生成失败', icon: generated2d.value ? 'success' : 'none' })
  } catch (e: any) {
    status.value = 'failed'
    notice.value = `生成失败：${e?.message || '本地模型未就绪或接口不可用'}。可先到「图转2.5D」上传图片。`
    uni.showToast({ title: '生成失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

async function convertTo25d() {
  if (!imageUrl.value) {
    uni.showToast({ title: '请先生成 2D 图片', icon: 'none' })
    return
  }
  if (depthReady.value) {
    uni.showToast({ title: '2.5D预览已就绪', icon: 'success' })
    return
  }
  converting.value = true
  uni.showLoading({ title: '转换2.5D…' })
  runMockProgress(20)
  try {
    const depth: any = await api.processing.depthMap(imageUrl.value)
    depthUrl.value = normalize(depth.depth_url || '')
    const pod: any = await api.processing.pod3d(depthUrl.value, 1.2, 45, 5, 32)
    pod3dUrl.value = normalize(pod.output_url || pod.pod3d_url || '')
    depthReady.value = !!depthUrl.value && !!pod3dUrl.value
    notice.value = depthReady.value ? '2.5D预览已生成。' : '2.5D转换未完成，请重试。'
    progress.value = 100
    uni.showToast({ title: depthReady.value ? '转换成功' : '转换失败', icon: depthReady.value ? 'success' : 'none' })
  } catch (e: any) {
    notice.value = `转换失败：${e?.message || '接口不可用'}`
    uni.showToast({ title: '转换失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    converting.value = false
  }
}

function saveWork() {
  const works = uni.getStorageSync('mock_25d_works') || []
  works.unshift({
    id: Date.now(),
    type: 'text25d',
    title: prompt.value.trim().slice(0, 18) || '文生2.5D作品',
    style: selectedStyleLabel.value,
    status: depthReady.value ? '2.5D预览已生成' : '2D图已生成',
    image_url: imageUrl.value,
    depth_url: depthUrl.value,
    pod3d_url: pod3dUrl.value,
    created_at: new Date().toLocaleString(),
  })
  uni.setStorageSync('mock_25d_works', works.slice(0, 20))
  uni.showToast({ title: '作品已保存', icon: 'success' })
}

function useExample(item: string) {
  prompt.value = item
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
      title: '31度文生2.5D内雕',
      path: '/pages/text25d/index?from=share',
    }
  },
}
</script>

<style lang="scss" scoped>
.ai-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  background: $page-bg;
}

/* ---------- 蓝色系 Hero ---------- */
.hero {
  position: relative;
  padding: 44rpx 32rpx 52rpx;
  background: $grad-blue;
  border-radius: 0 0 40rpx 40rpx;
  overflow: hidden;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
}

.hero-orb.orb-a {
  width: 300rpx;
  height: 300rpx;
  right: -100rpx;
  top: -120rpx;
}

.hero-orb.orb-b {
  width: 180rpx;
  height: 180rpx;
  left: -70rpx;
  bottom: -80rpx;
  background: rgba(255, 255, 255, 0.09);
}

.eyebrow {
  position: relative;
  display: block;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.title {
  position: relative;
  display: block;
  margin-top: 12rpx;
  font-size: 56rpx;
  line-height: 1.1;
  font-weight: 900;
  color: #ffffff;
}

.subtitle {
  position: relative;
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.9);
}

.hero-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-top: 20rpx;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
}

/* ---------- 主体 ---------- */
.body {
  padding: 0 $page-gap;
}

.card {
  margin-top: $section-gap;
  padding: $card-padding;
  background: $card-bg;
  border-radius: $card-radius;
  box-shadow: $card-shadow;
}

/* ---------- 区块标题 ---------- */
.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.title-bar {
  width: 8rpx;
  height: 32rpx;
  border-radius: 4rpx;
}

.title-bar.blue { background: $grad-blue; }

.title-text {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 800;
  color: $ink-title;
}

.counter {
  font-size: 24rpx;
  color: $ink-muted;
}

/* ---------- 输入 ---------- */
.prompt-input {
  width: 100%;
  min-height: 200rpx;
  box-sizing: border-box;
  padding: 24rpx;
  border-radius: $field-radius;
  background: $field-bg;
  color: $ink-title;
  font-size: 26rpx;
  line-height: 1.5;
}

.example-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 20rpx;
}

.example-chip {
  max-width: 100%;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: $field-bg;
  color: $ink-body;
  font-size: 22rpx;
  line-height: 1.45;
}

/* ---------- 风格 ---------- */
.style-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.style-chip {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 96rpx;
  box-sizing: border-box;
  padding: 16rpx 20rpx;
  border-radius: 20rpx;
  background: $field-bg;
  border: 2rpx solid transparent;
}

.style-chip.active {
  background: rgba($brand-blue, 0.08);
  border-color: $brand-blue;
}

.style-dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.style-dot.dot-crystal { background: #1F8BFF; }
.style-dot.dot-portrait { background: #8B5CF6; }
.style-dot.dot-product { background: #F5A623; }
.style-dot.dot-logo { background: #22C55E; }

.style-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.style-name {
  font-size: 26rpx;
  font-weight: 700;
  color: $ink-title;
}

.style-desc {
  font-size: 22rpx;
  color: $ink-muted;
}

.style-chip.active .style-name {
  color: $brand-blue-deep;
}

/* ---------- 生成流程 ---------- */
.pipeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8rpx;
}

.pipeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  text-align: center;
}

.step-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #D9DCE5;
}

.pipeline-step.done .step-dot {
  background: $ok;
}

.pipeline-step.active .step-dot {
  background: $brand-blue;
}

.step-label {
  font-size: 21rpx;
  line-height: 1.3;
  color: $ink-muted;
}

.pipeline-step.done .step-label,
.pipeline-step.active .step-label {
  color: $ink-body;
}

/* ---------- 结果双卡 ---------- */
.result-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.result-card {
  display: flex;
  flex-direction: column;
}

.result-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: $ink-body;
}

.mock-canvas {
  height: 280rpx;
  border-radius: 20rpx;
  background: $field-bg;
  border: 2rpx dashed #D9DCE5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  box-sizing: border-box;
}

.mock-canvas.ready {
  border-style: solid;
  border-color: $brand-blue;
  background: #EDF5FF;
}

.mock-canvas.depth.ready {
  background: linear-gradient(145deg, #EAF4FF, #FFFFFF);
}

.result-img {
  width: 100%;
  height: 100%;
}

.state-text {
  color: $ink-muted;
  font-size: 23rpx;
  line-height: 1.45;
}

/* ---------- 深度图 ---------- */
.depth-row {
  margin-top: 16rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: $field-bg;
}

.depth-label {
  display: block;
  margin-bottom: 12rpx;
  color: $ink-body;
  font-size: 22rpx;
}

.depth-img {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  background: #E9EBF2;
}

/* ---------- 主 / 次按钮 ---------- */
.action-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  gap: 16rpx;
  margin-top: $section-gap;
}

.btn-primary,
.btn-secondary {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 27rpx;
  font-weight: 800;
  padding: 0;
}

.btn-primary {
  background: $grad-blue;
  color: #ffffff;
}

.btn-secondary {
  background: $field-bg;
  color: $ink-body;
}

.btn-primary[disabled],
.btn-secondary[disabled],
.ghost-btn[disabled] {
  opacity: 0.5;
}

.btn-primary::after,
.btn-secondary::after,
.ghost-btn::after {
  border: none;
}

/* ---------- 提示 ---------- */
.notice {
  display: block;
  margin-top: $section-gap;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: rgba($brand-blue, 0.08);
  color: $brand-blue-deep;
  font-size: 22rpx;
  line-height: 1.5;
}

/* ---------- 操作按钮组 ---------- */
.action-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: $section-gap;
}

.ghost-btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background: $field-bg;
  color: $ink-body;
  font-size: 24rpx;
  font-weight: 800;
  padding: 0;
}
</style>
