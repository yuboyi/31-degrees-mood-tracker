<template>
  <view class="creative-page">
    <view class="creative-hero">
      <view class="brand-lockup">
        <text class="brand-symbol">31°</text>
        <text class="brand-name">31度文创</text>
      </view>
      <text class="eyebrow">31度 · {{ activeIndustryLabel }}定制区</text>
      <text class="title">{{ activeIndustry === 'uv' ? '照片变卡通，预览再打印' : activeIndustry === 'laser' ? '上传照片，预览激光效果' : '选成品，选模板，开始制作' }}</text>
      <text class="subtitle">{{ activeIndustry === 'uv' ? 'AI拍照或上传照片，选择彩印成品后确认效果与报价。' : activeIndustry === 'laser' ? '照片转灰度 / 2.5D，确认效果后生成加工包。' : '选择彩印或激光工艺，查看对应的成品与模板。' }}</text>
    </view>

    <view v-if="!regionLocked" class="industry-switch section">
      <view
        v-for="item in industryTabs"
        :key="item.key"
        class="industry-tab"
        :class="{ selected: activeIndustry === item.key }"
        @tap="setIndustry(item.key)"
      >
        <text class="industry-title">{{ item.title }}</text>
        <text class="industry-description">{{ item.description }}</text>
      </view>
    </view>

    <view class="section workflow-section">
      <view class="section-heading">
        <text class="section-title">定制流程</text>
        <text class="section-note">{{ activeIndustryLabel }}</text>
      </view>
      <view class="workflow-row">
        <view v-for="(item, index) in workflowSteps" :key="item.title" class="workflow-step">
          <text class="workflow-index">{{ index + 1 }}</text>
          <text class="workflow-title">{{ item.title }}</text>
          <text class="workflow-note">{{ item.note }}</text>
        </view>
      </view>
    </view>

    <view v-show="!loading && !catalogError && visibleRecentTemplates.length" class="section recent-section">
      <view class="section-heading">
        <text class="section-title">最近使用</text>
        <text class="section-note">继续上次制作</text>
      </view>
      <scroll-view scroll-x class="recent-scroll" :show-scrollbar="false">
        <view class="recent-row">
          <view v-for="item in visibleRecentTemplates" :key="item.id" class="recent-item" @tap="openTemplate(item)">
            <image class="recent-image" :src="item.preview_url || item.overlay_url" mode="aspectFill" />
            <text class="recent-name">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="section process-section">
      <view class="section-heading">
        <text class="section-title">制作方式</text>
        <text class="section-note">{{ activeIndustryLabel }}工艺入口</text>
      </view>
      <view class="process-grid">
        <view v-for="item in visibleProcessEntries" :key="item.key" class="process-card" @tap="openProcess(item.key)">
          <text class="process-icon">{{ item.icon }}</text>
          <view class="process-copy">
            <text class="process-title">{{ item.title }}</text>
            <text class="process-description">{{ item.description }}</text>
          </view>
          <text class="process-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="section catalog-section">
      <view class="section-heading">
        <text class="section-title">成品与模板</text>
        <text class="section-note">{{ templates.length }} 个{{ activeIndustryLabel }}模板</text>
      </view>

      <scroll-view scroll-x class="type-scroll" :show-scrollbar="false">
        <view class="type-row">
          <view class="type-chip" :class="{ selected: selectedTypeId === null }" @tap="selectType(null)">
            <text>全部成品</text>
          </view>
          <view
            v-for="item in visibleTemplateTypes"
            :key="item.id"
            class="type-chip"
            :class="{ selected: selectedTypeId === item.id }"
            @tap="selectType(item.id)"
          >
            <image v-if="item.image_url" class="type-image" :src="normalizeAsset(item.image_url)" mode="aspectFit" />
            <text>{{ item.name }}</text>
            <text class="type-meta">{{ item.customization_type }}</text>
          </view>
        </view>
      </scroll-view>

      <view v-if="loading" class="empty-state">正在加载后台模板...</view>
      <view v-else-if="catalogError" class="empty-state">
        <text>暂时无法加载成品目录</text>
        <text class="empty-note">请检查网络后重试，未加载真实模板前不能开始制作。</text>
        <button size="mini" @tap="loadCatalog">重新加载</button>
      </view>
      <view v-else-if="!templates.length" class="empty-state">
        <text>当前成品还没有可用模板</text>
        <text class="empty-note">请在管理后台新增并启用模板后刷新</text>
      </view>
      <view v-else class="template-grid">
        <view v-for="item in templates" :key="item.id" class="template-card" @tap="openTemplate(item)">
          <text class="template-brand">31°</text>
          <image v-if="item.preview_url || item.overlay_url" class="template-image" :src="item.preview_url || item.overlay_url" mode="aspectFill" />
          <view v-else class="template-placeholder">
            <text>31°</text>
          </view>
          <view class="template-info">
            <text class="template-name">{{ item.name }}</text>
            <text class="template-type">{{ item.template_type_name || item.category || '文创模板' }}</text>
          </view>
          <text class="template-action">开始制作 ›</text>
        </view>
      </view>
    </view>

    <view class="footer-note">
      <text>设计预览、加工文件和生产任务分开保存</text>
      <text>加工图片交门店电脑处理，实际打印由现场人员完成</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api } from '@/api'
import { templateIndustry } from '@/utils/homeRegions.mjs'
import { loadCreativeCatalog } from '@/utils/creativeCatalog.mjs'

type TemplateType = {
  id: number | string
  name: string
  customization_type?: string
  image_url?: string
  template_count?: number
  is_active?: boolean
}

type Template = {
  id: number | string
  name: string
  category?: string
  preview_url?: string
  overlay_url?: string
  product_type?: string
  template_type_id?: number | string | null
  template_type_name?: string | null
}

const processEntries = [
  { key: 'photobooth', industry: 'uv', icon: '◉', title: 'AI拍照打印', description: '拍照 / 上传 → AI卡通 → 成品效果预览' },
  { key: 'laser', industry: 'laser', icon: '⌁', title: '光学激光', description: '照片、Logo、文字做成激光打标或内雕' },
  { key: 'relief', industry: 'laser', icon: '◈', title: '浮雕 / 2.5D', description: '生成深度图、BMP和2.5D预览包' },
  { key: 'coin', industry: 'laser', icon: '◎', title: 'AI纪念币', description: '人像生成币面，输出BMP和STL中间文件' },
  { key: 'inkjet', industry: 'uv', icon: '▦', title: '彩印文创', description: '衣服、冰箱贴、铭牌等模板定制' },
]

const industryTabs = [
  { key: 'all', title: '全部工艺', description: '先看完整文创目录' },
  { key: 'uv', title: 'UV 彩印', description: '衣服、杯子、手机壳与展示件' },
  { key: 'laser', title: '激光工艺', description: '内雕、浮雕、纪念币与木牌' },
] as const

const workflowSteps = computed(() => activeIndustry.value === 'laser' ? [
  { title: '上传照片', note: '选择素材' }, { title: '生成效果', note: '灰度 / 2.5D' },
  { title: '效果预览', note: '确认尺寸与工艺' }, { title: '生成加工包', note: '确认后交门店加工' },
] : [
  { title: '拍照上传', note: '选择照片' }, { title: 'AI卡通', note: '生成风格效果' },
  { title: '成品预览', note: '选择材料与模板' }, { title: '询价打印', note: '确认价格后制作' },
])

const loading = ref(false)
const catalogError = ref(false)
const templateTypes = ref<TemplateType[]>([])
const allTemplates = ref<Template[]>([])
const selectedTypeId = ref<number | string | null>(null)
const activeIndustry = ref<'all' | 'uv' | 'laser'>('all')
const regionLocked = ref(false)
const recentTemplates = ref<Template[]>([])
const visibleRecentTemplates = computed(() => recentTemplates.value.filter(item =>
  activeIndustry.value === 'all' || templateIndustry(item, templateTypes.value) === activeIndustry.value))

onLoad((options: any) => {
  if (options?.industry === 'uv' || options?.industry === 'laser') {
    activeIndustry.value = options.industry
    regionLocked.value = true
    uni.setNavigationBarTitle({ title: options.industry === 'uv' ? '彩印喷墨定制区' : '光学激光定制区' })
  }
})

const templates = computed(() => {
  const industryTemplates = activeIndustry.value === 'all'
    ? allTemplates.value
    : allTemplates.value.filter(item => templateIndustry(item, templateTypes.value) === activeIndustry.value)
  if (selectedTypeId.value === null) return industryTemplates
  return industryTemplates.filter(item => item.template_type_id === selectedTypeId.value)
})

const visibleTemplateTypes = computed(() => {
  if (activeIndustry.value === 'all') return templateTypes.value
  const expected = activeIndustry.value === 'laser' ? '光学激光' : '彩印喷墨'
  return templateTypes.value.filter(item => item.customization_type === expected)
})

const visibleProcessEntries = computed(() => {
  if (activeIndustry.value === 'all') return processEntries
  return processEntries.filter(item => item.industry === activeIndustry.value)
})

const activeIndustryLabel = computed(() => {
  if (activeIndustry.value === 'uv') return 'UV 彩印'
  if (activeIndustry.value === 'laser') return '激光'
  return '全部工艺'
})

onShow(() => {
  loadRecentTemplates()
  loadCatalog()
})

async function loadCatalog() {
  if (loading.value) return
  loading.value = true
  catalogError.value = false
  try {
    const catalog = await loadCreativeCatalog(api)
    const apiTypes = catalog.types
    const apiTemplates = catalog.templates.map(normalizeTemplate)
    templateTypes.value = apiTypes
    allTemplates.value = apiTemplates
    recentTemplates.value = recentTemplates.value.flatMap(recent => {
      const current = apiTemplates.find(item => item.id === recent.id)
      return current ? [current] : []
    })
    if (!apiTypes.some(item => item.id === selectedTypeId.value)) selectedTypeId.value = null
  } catch (error) {
    console.warn('文创目录加载失败:', error)
    catalogError.value = true
    templateTypes.value = []
    allTemplates.value = []
  } finally {
    loading.value = false
  }
}

function normalizeTemplate(item: any): Template {
  return {
    ...item,
    preview_url: normalizeAsset(item.preview_url),
    overlay_url: normalizeAsset(item.overlay_url),
  }
}

function normalizeAsset(url?: string) {
  if (!url) return ''
  return url
}

function selectType(id: number | string | null) {
  selectedTypeId.value = id
}

function setIndustry(value: 'all' | 'uv' | 'laser') {
  activeIndustry.value = value
  selectedTypeId.value = null
}

function isLaserTemplate(item: Template) {
  return templateIndustry(item, templateTypes.value) === 'laser'
}

function loadRecentTemplates() {
  const stored = uni.getStorageSync('creative_recent_templates')
  if (Array.isArray(stored)) recentTemplates.value = stored.slice(0, 6)
}

function openTemplate(item: Template) {
  if (loading.value || catalogError.value || !allTemplates.value.some(current => current.id === item.id)) {
    uni.showToast({ title: '请先重新加载可用模板', icon: 'none' })
    return
  }
  const scene = isLaserTemplate(item) ? 'laser' : 'inkjet'
  recentTemplates.value = [item, ...recentTemplates.value.filter(recent => recent.id !== item.id)].slice(0, 6)
  uni.setStorageSync('creative_recent_templates', recentTemplates.value)
  uni.navigateTo({
    url: `/pages/editor/editor?scene=${scene}&id=${item.id}`,
  })
}

function openProcess(key: string) {
  const routes: Record<string, string> = {
    photobooth: '/pages/photobooth/index',
    laser: '/pages/image25d/index',
    relief: '/pages/image25d/index',
    coin: '/pages/coin/index',
    inkjet: '/pages/editor/editor?scene=inkjet',
  }
  const url = routes[key]
  if (url) {
    uni.navigateTo({ url })
  }
}
</script>

<style lang="scss" scoped>
.creative-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: 60rpx;
  background: #f6f7fb;
}

.creative-hero {
  padding: 54rpx 32rpx 48rpx;
  background: #171a23;
  color: #fff;
}

.eyebrow {
  display: block;
  color: #ffb84d;
  font-size: 24rpx;
  font-weight: 700;
}

.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  color: #fff;
}

.brand-symbol {
  display: inline-flex;
  width: 58rpx;
  height: 58rpx;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #d94c4c;
  border: 2rpx solid rgba(255, 255, 255, 0.82);
  border-radius: 50%;
  font-size: 24rpx;
  font-weight: 900;
}

.brand-name {
  font-size: 26rpx;
  font-weight: 800;
  letter-spacing: 0;
}

.title {
  display: block;
  margin-top: 18rpx;
  font-size: 44rpx;
  line-height: 1.2;
  font-weight: 800;
}

.subtitle {
  display: block;
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.72);
  font-size: 25rpx;
  line-height: 1.55;
}

.industry-switch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 24rpx;
}

.industry-tab {
  min-height: 116rpx;
  box-sizing: border-box;
  padding: 20rpx 18rpx;
  color: #555f70;
  background: #fff;
  border: 1rpx solid #e4e8ef;
  border-radius: 10rpx;
}

.industry-tab.selected {
  color: #fff;
  background: #202631;
  border-color: #202631;
  box-shadow: 0 8rpx 20rpx rgba(32, 38, 49, 0.16);
}

.industry-title,
.industry-description,
.workflow-title,
.workflow-note,
.recent-name {
  display: block;
}

.industry-title {
  font-size: 28rpx;
  font-weight: 800;
}

.industry-description {
  margin-top: 10rpx;
  color: #8c95a5;
  font-size: 20rpx;
  line-height: 1.35;
}

.industry-tab.selected .industry-description {
  color: rgba(255, 255, 255, 0.7);
}

.workflow-section {
  margin-top: 24rpx;
}

.workflow-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
}

.workflow-step {
  min-height: 136rpx;
  box-sizing: border-box;
  padding: 16rpx 12rpx;
  background: #fff;
  border: 1rpx solid #edf0f5;
  border-radius: 8rpx;
}

.workflow-index {
  display: inline-flex;
  width: 34rpx;
  height: 34rpx;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #e0443e;
  border-radius: 50%;
  font-size: 18rpx;
  font-weight: 800;
}

.workflow-title {
  margin-top: 12rpx;
  color: #202636;
  font-size: 22rpx;
  font-weight: 800;
}

.workflow-note {
  margin-top: 6rpx;
  color: #8a92a3;
  font-size: 18rpx;
  line-height: 1.35;
}

.recent-section {
  margin-top: 24rpx;
}

.recent-scroll {
  white-space: nowrap;
}

.recent-row {
  display: inline-flex;
  gap: 14rpx;
}

.recent-item {
  width: 150rpx;
  box-sizing: border-box;
  padding: 10rpx;
  background: #fff;
  border: 1rpx solid #edf0f5;
  border-radius: 8rpx;
}

.recent-image {
  display: block;
  width: 130rpx;
  height: 100rpx;
  border-radius: 6rpx;
  background: #f1f3f7;
}

.recent-name {
  overflow: hidden;
  margin-top: 8rpx;
  color: #3b4352;
  font-size: 20rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section {
  padding: 0 28rpx;
  margin-top: 30rpx;
}

.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.section-title {
  color: #1d2330;
  font-size: 32rpx;
  font-weight: 800;
}

.section-note {
  color: #8b93a3;
  font-size: 22rpx;
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
}

@media screen and (max-width: 1000px) {
  .process-grid,
  .template-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 700px) {
  .workflow-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 560px) {
  .process-grid {
    grid-template-columns: 1fr;
  }
}

.process-card {
  position: relative;
  min-height: 142rpx;
  box-sizing: border-box;
  padding: 22rpx 40rpx 20rpx 22rpx;
  background: #fff;
  border: 1rpx solid #edf0f5;
  border-radius: 10rpx;
  box-shadow: 0 8rpx 22rpx rgba(26, 34, 52, 0.05);
}

.process-icon {
  display: block;
  color: #e0443e;
  font-size: 38rpx;
  line-height: 1;
  font-weight: 700;
}

.process-copy {
  margin-top: 14rpx;
}

.process-title,
.process-description,
.template-name,
.template-type,
.template-action,
.empty-state,
.empty-note,
.footer-note text {
  display: block;
}

.process-title {
  color: #202636;
  font-size: 28rpx;
  font-weight: 700;
}

.process-description {
  margin-top: 8rpx;
  color: #8a92a3;
  font-size: 22rpx;
  line-height: 1.4;
}

.process-arrow {
  position: absolute;
  top: 54rpx;
  right: 18rpx;
  color: #b1b7c2;
  font-size: 34rpx;
}

.type-scroll {
  white-space: nowrap;
}

.type-row {
  display: inline-flex;
  width: max-content;
  min-width: 100%;
  gap: 14rpx;
  padding-bottom: 8rpx;
}

.type-chip {
  display: inline-flex;
  flex-shrink: 0;
  white-space: nowrap;
  align-items: center;
  gap: 8rpx;
  box-sizing: border-box;
  min-height: 62rpx;
  padding: 0 20rpx;
  color: #596273;
  background: #fff;
  border: 1rpx solid #e4e8ef;
  border-radius: 31rpx;
  font-size: 24rpx;
}

.type-image {
  flex-shrink: 0;
  width: 42rpx;
  height: 42rpx;
  border-radius: 6rpx;
  background: #f5f6f8;
}

.type-chip.selected {
  color: #fff;
  background: #e0443e;
  border-color: #e0443e;
}

.type-meta {
  color: inherit;
  opacity: 0.7;
  font-size: 19rpx;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 20rpx;
}

.template-card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1rpx solid #edf0f5;
  border-radius: 10rpx;
  box-shadow: 0 8rpx 22rpx rgba(26, 34, 52, 0.05);
}

.template-brand {
  position: absolute;
  top: 14rpx;
  left: 14rpx;
  z-index: 1;
  display: inline-flex;
  width: 42rpx;
  height: 42rpx;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(217, 76, 76, 0.92);
  border: 2rpx solid rgba(255, 255, 255, 0.86);
  border-radius: 50%;
  font-size: 18rpx;
  font-weight: 900;
}

.template-image,
.template-placeholder {
  display: block;
  width: 100%;
  height: 220px;
  background: #eef1f5;
}

.template-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e0443e;
  font-size: 54rpx;
  font-weight: 800;
}

.template-info {
  padding: 16rpx 18rpx 0;
}

.template-name {
  overflow: hidden;
  color: #222938;
  font-size: 27rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-type {
  margin-top: 7rpx;
  color: #8b93a3;
  font-size: 21rpx;
}

.template-action {
  padding: 16rpx 18rpx 18rpx;
  color: #e0443e;
  font-size: 23rpx;
  font-weight: 700;
}

.empty-state {
  padding: 80rpx 20rpx 28rpx;
  color: #606a7c;
  text-align: center;
  font-size: 26rpx;
}

.empty-note {
  margin-top: 12rpx;
  color: #9ba3b1;
  font-size: 22rpx;
}

.footer-note {
  margin: 36rpx 28rpx 0;
  padding: 22rpx;
  color: #80899a;
  background: #eceff4;
  border-radius: 8rpx;
  font-size: 21rpx;
  line-height: 1.7;
}

@media screen and (max-width: 1000px) {
  .template-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .template-image, .template-placeholder { height: 180px; }
}
</style>
