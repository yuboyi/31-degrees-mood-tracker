<template>
  <view class="coin-page">
    <!-- 金色渐变 Hero -->
    <view class="hero">
      <view class="hero-orb orb-a"></view>
      <view class="hero-orb orb-b"></view>
      <text class="eyebrow">AI 纪念币</text>
      <text class="title">一人一币 · 独一无二</text>
      <text class="subtitle">上传照片 → AI生成圆形币面（环绕文字）→ 输出灰度图/BMP/STL 内雕加工包</text>
    </view>

    <view class="body">
      <!-- 上传大卡 -->
      <view class="upload-card" @tap="capture">
        <image v-if="localImage" class="upload-image" :src="localImage" mode="aspectFit" />
        <view v-else class="upload-empty">
          <text class="upload-plus">+</text>
          <text class="upload-title">上传人像照片</text>
          <text class="upload-desc">正面人像效果最佳 · 最大10M · png/jpg</text>
        </view>
      </view>

      <!-- 币面文字 -->
      <view class="card">
        <view class="section-title">
          <view class="title-bar gold"></view>
          <text class="title-text">币面文字</text>
          <text class="panel-note">环绕在币面边缘</text>
        </view>
        <view class="field">
          <text class="field-label">顶部文字</text>
          <input v-model="ringTop" class="field-input" maxlength="24" placeholder="如：清凉夏日" />
        </view>
        <view class="field">
          <text class="field-label">底部文字</text>
          <input v-model="ringBottom" class="field-input" maxlength="24" placeholder="如：31度科技·2026" />
        </view>
      </view>

      <!-- 材质与尺寸 -->
      <view class="card">
        <view class="section-title">
          <view class="title-bar gold"></view>
          <text class="title-text">材质与尺寸</text>
        </view>
        <text class="group-label">材质</text>
        <view class="chip-row">
          <view
            v-for="item in materials"
            :key="item.value"
            class="option-chip"
            :class="{ selected: template === item.value }"
            @tap="template = item.value"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
        <text class="group-label">尺寸</text>
        <view class="chip-row">
          <view
            v-for="item in sizes"
            :key="item"
            class="option-chip"
            :class="{ selected: coinSize === item }"
            @tap="coinSize = item"
          >
            <text>{{ item }}</text>
          </view>
        </view>
      </view>

      <!-- 生成按钮 -->
      <button class="btn-gold" :disabled="running" @tap="generateCoin">
        {{ running ? `正在生成 ${progress}%` : '一键生成AI纪念币' }}
      </button>

      <!-- 结果区 -->
      <view v-if="coinUrl" class="card">
        <view class="section-title">
          <view class="title-bar gold"></view>
          <text class="title-text">纪念币预览</text>
          <text class="panel-note">{{ stlTriangles ? `STL ${Math.round(stlTriangles / 1000)}k 三角面` : '' }}</text>
        </view>
        <view class="coin-frame">
          <image class="coin-preview" :src="coinUrl" mode="aspectFit" />
        </view>
        <image v-if="depthUrl" class="depth-preview" :src="depthUrl" mode="aspectFit" />
        <text v-if="depthUrl" class="depth-label">↑ 灰度深度图（内雕层次）</text>

        <view class="output-grid">
          <view v-for="item in outputs" :key="item.key" class="output-item" :class="{ ready: !!item.url }" @tap="copyOutput(item)">
            <text class="output-name">{{ item.name }}</text>
            <text class="output-status">{{ item.url ? '已生成' : '等待' }}</text>
          </view>
        </view>
        <text class="coin-note">BMP/STL 为加工中间文件；现场设备软件(LaserMark .orr / RK-CAD .rkq)由PC客户端转换导入。</text>
      </view>

      <text v-if="notice" class="notice">{{ notice }}</text>

      <!-- 底部操作 -->
      <view class="action-row">
        <button class="btn-secondary" :disabled="!coinUrl" @tap="saveWork">保存作品</button>
        <button class="btn-secondary accent" @tap="goImage25d">去图转2.5D</button>
        <button class="btn-secondary" open-type="contact" @tap="contactFallback">联系客服</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, getApiBaseUrl, getUploadUrl } from '@/api'
import { useUserStore } from '@/stores/user'
import { useAgentHandoffStore } from '@/stores/agentHandoff'

const userStore = useUserStore()
const localImage = ref('')
const ringTop = ref('清凉夏日')
const ringBottom = ref('31度科技·2026')
const template = ref('gold')
const coinSize = ref('60mm')
const coinUrl = ref('')
const depthUrl = ref('')
const bmpUrl = ref('')
const stlUrl = ref('')
const profileUrl = ref('')
const stlTriangles = ref(0)
const running = ref(false)
const progress = ref(0)
const notice = ref('')

const materials = [
  { value: 'gold', label: '金币' },
  { value: 'silver', label: '银币' },
]
const sizes = ['40mm', '50mm', '60mm', '80mm']

const outputs = computed(() => [
  { key: 'bmp', name: 'BMP灰度位图', url: bmpUrl.value },
  { key: 'stl', name: 'STL高度模型', url: stlUrl.value },
  { key: 'profile', name: '打样参数JSON', url: profileUrl.value },
])

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

onShow(() => {
  consumeAgentHandoff()
})

function consumeAgentHandoff() {
  try {
    const store = useAgentHandoffStore()
    if (!store.hasHandoff || !store.payload) return
    const p: any = store.payload
    if (p.coin_url) coinUrl.value = normalize(p.coin_url)
    if (p.depth_url) depthUrl.value = normalize(p.depth_url)
    if (p.bmp_url) bmpUrl.value = normalize(p.bmp_url)
    if (p.stl_url) stlUrl.value = normalize(p.stl_url)
    if (p.profile_url) profileUrl.value = normalize(p.profile_url)
    if (p.material) template.value = String(p.material)
    if (p.ringTextTop) ringTop.value = String(p.ringTextTop)
    if (p.ringTextBottom) ringBottom.value = String(p.ringTextBottom)
    if (p.coin_size_mm) coinSize.value = `${p.coin_size_mm}mm`
    stlTriangles.value = Number(p.stl_triangles || 0)
    notice.value = '已载入微信AI生成的纪念币，可复核后提交打样。'
    store.consumeHandoff()
  } catch {
    // 忽略异常
  }
}

function capture() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res: any) {
      const file = res.tempFiles?.[0]
      const path = (res.tempFilePaths?.[0] || '') as string
      const ext = path.split('.').pop()?.toLowerCase() || ''
      if (!['png', 'jpg', 'jpeg'].includes(ext)) {
        uni.showToast({ title: '仅支持png、jpg格式', icon: 'none' })
        return
      }
      if ((file?.size || 0) > 10 * 1024 * 1024) {
        uni.showToast({ title: '图片请控制在10M以内', icon: 'none' })
        return
      }
      localImage.value = path
      coinUrl.value = ''
      depthUrl.value = ''
      bmpUrl.value = ''
      stlUrl.value = ''
      profileUrl.value = ''
      stlTriangles.value = 0
      notice.value = ''
    },
    fail() {
      uni.showToast({ title: '没有拿到照片', icon: 'none' })
    },
  })
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function markProgress(value: number) {
  progress.value = value
  await sleep(100)
}

async function generateCoin() {
  if (!localImage.value) {
    capture()
    return
  }
  running.value = true
  progress.value = 5
  notice.value = ''
  uni.showLoading({ title: 'AI生成纪念币…' })
  try {
    await ensureLogin()
    const url = await uploadImage(localImage.value)
    await markProgress(20)
    const res: any = await api.processing.coinPackage({
      image_url: url,
      coin_size_mm: Number(coinSize.value.replace('mm', '')),
      template: template.value,
      ring_text_top: ringTop.value.trim(),
      ring_text_bottom: ringBottom.value.trim(),
    })
    coinUrl.value = normalize(res.coin_url || '')
    depthUrl.value = normalize(res.depth_url || '')
    bmpUrl.value = normalize(res.bmp_url || '')
    stlUrl.value = normalize(res.stl_url || '')
    profileUrl.value = normalize(res.machine_profile_url || '')
    stlTriangles.value = Number(res.stl_triangles || 0)
    if (!coinUrl.value) throw new Error('未返回币面预览')
    await markProgress(100)
    notice.value = '纪念币已生成：币面预览 + 灰度深度图 + BMP + STL 加工包。'
    uni.showToast({ title: '纪念币已生成', icon: 'success' })
  } catch (e: any) {
    notice.value = `生成失败：${e?.message || '接口不可用'}`
    uni.showToast({ title: '生成失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
    running.value = false
  }
}

function saveWork() {
  const works = uni.getStorageSync('mock_25d_works') || []
  works.unshift({
    id: Date.now(),
    type: 'coin',
    title: `AI纪念币 · ${ringTop.value || '纪念币'}`,
    style: `${template.value === 'gold' ? '金币' : '银币'} ${coinSize.value}`,
    status: '纪念币加工包已生成',
    source_url: localImage.value,
    coin_url: coinUrl.value,
    depth_url: depthUrl.value,
    bmp_url: bmpUrl.value,
    stl_url: stlUrl.value,
    machine_profile_url: profileUrl.value,
    stl_triangles: stlTriangles.value,
    created_at: new Date().toLocaleString(),
  })
  uni.setStorageSync('mock_25d_works', works.slice(0, 20))
  uni.showToast({ title: '作品已保存', icon: 'success' })
}

function copyOutput(item: { name: string; url: string }) {
  if (!item.url) {
    uni.showToast({ title: '文件尚未生成', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: item.url,
    success() {
      uni.showToast({ title: `${item.name}链接已复制`, icon: 'success' })
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

<style lang="scss" scoped>
.coin-page {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f6f7fb;
  color: #1a1a2e;
}

/* 金色渐变 Hero */
.hero {
  position: relative;
  overflow: hidden;
  padding: 56rpx 32rpx 44rpx;
  background: linear-gradient(135deg, #ffb02e 0%, #f5a623 55%, #e88f1a 100%);
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}

.orb-a {
  width: 320rpx;
  height: 320rpx;
  right: -90rpx;
  top: -110rpx;
}

.orb-b {
  width: 180rpx;
  height: 180rpx;
  right: 120rpx;
  bottom: -80rpx;
  background: rgba(255, 255, 255, 0.12);
}

.eyebrow {
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
  font-weight: 700;
}

.title {
  color: #fff;
  font-size: 44rpx;
  font-weight: 900;
}

.subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 23rpx;
  line-height: 1.5;
  max-width: 560rpx;
}

.body {
  padding: 24rpx 32rpx 180rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 通用卡片 */
.card {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(26, 26, 46, 0.05);
  padding: 32rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 24rpx;
}

.title-bar {
  width: 8rpx;
  height: 32rpx;
  border-radius: 4rpx;
}

.title-bar.gold {
  background: linear-gradient(180deg, #ffb02e, #e88f1a);
}

.title-text {
  font-size: 28rpx;
  font-weight: 800;
  color: #1a1a2e;
  flex: 1;
}

.panel-note {
  color: #9a9fae;
  font-size: 22rpx;
}

/* 上传卡 */
.upload-card {
  height: 340rpx;
  border-radius: 24rpx;
  background: #ffffff;
  border: 2rpx dashed #f0c27a;
  display: flex;
  align-items: center;
  justify-content: center;
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
  gap: 10rpx;
  color: #9a9fae;
}

.upload-plus {
  color: #f5a623;
  font-size: 64rpx;
  line-height: 1;
  font-weight: 900;
}

.upload-title {
  color: #1a1a2e;
  font-size: 30rpx;
  font-weight: 800;
}

.upload-desc {
  font-size: 21rpx;
}

/* 输入 */
.field {
  margin-bottom: 20rpx;
}

.field:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  margin-bottom: 10rpx;
  color: #555a6e;
  font-size: 24rpx;
  font-weight: 700;
}

.field-input {
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #f1f2f6;
  color: #1a1a2e;
  font-size: 26rpx;
  box-sizing: border-box;
}

.group-label {
  display: block;
  margin: 16rpx 0 12rpx;
  color: #9a9fae;
  font-size: 22rpx;
  font-weight: 700;
}

.group-label:first-of-type {
  margin-top: 0;
}

/* 胶囊 */
.chip-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
}

.option-chip {
  min-height: 64rpx;
  border-radius: 32rpx;
  background: #f1f2f6;
  color: #555a6e;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.option-chip.selected {
  background: rgba(245, 166, 35, 0.12);
  border: 1rpx solid rgba(245, 166, 35, 0.55);
  color: #d98c12;
}

/* 金色主按钮 */
.btn-gold {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #ffb02e, #e88f1a);
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  box-shadow: 0 10rpx 20rpx rgba(245, 166, 35, 0.25);
}

.btn-gold[disabled] {
  opacity: 0.6;
}

.btn-gold::after,
.btn-secondary::after {
  border: none;
}

/* 结果卡 */
.coin-frame {
  width: 440rpx;
  height: 440rpx;
  margin: 0 auto 20rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 8rpx solid #f0c27a;
  background: #fff7e8;
  box-shadow: 0 12rpx 28rpx rgba(245, 166, 35, 0.2);
}

.coin-preview {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.depth-preview {
  width: 100%;
  height: 280rpx;
  border-radius: 16rpx;
  background: #f1f2f6;
}

.depth-label {
  display: block;
  margin-top: 8rpx;
  color: #9a9fae;
  font-size: 21rpx;
  text-align: center;
}

.output-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 20rpx;
}

.output-item {
  min-height: 92rpx;
  border-radius: 16rpx;
  background: #f6f7fb;
  border: 1rpx solid #edeef3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6rpx;
  padding: 0 14rpx;
}

.output-item.ready {
  background: rgba(245, 166, 35, 0.1);
  border-color: rgba(245, 166, 35, 0.4);
}

.output-name {
  color: #1a1a2e;
  font-size: 21rpx;
  font-weight: 800;
}

.output-status {
  color: #9a9fae;
  font-size: 19rpx;
}

.output-item.ready .output-status {
  color: #d98c12;
}

.coin-note {
  display: block;
  margin-top: 16rpx;
  color: #9a9fae;
  font-size: 21rpx;
  line-height: 1.55;
}

.notice {
  display: block;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(245, 166, 35, 0.1);
  color: #b97a0e;
  font-size: 22rpx;
  line-height: 1.55;
}

/* 底部操作 */
.action-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.btn-secondary {
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 38rpx;
  background: #ffffff;
  color: #555a6e;
  font-size: 23rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(26, 26, 46, 0.04);
}

.btn-secondary.accent {
  background: rgba(245, 166, 35, 0.12);
  color: #d98c12;
}

.btn-secondary[disabled] {
  opacity: 0.5;
}
</style>
