<template>
  <view class="page-materials">
    <!-- 上传入口 -->
    <view class="upload-entry" @tap="addMaterial">
      <text class="upload-icon">+</text>
      <text class="upload-label">上传新素材</text>
    </view>

    <!-- 分类筛选 -->
    <view class="filter-bar" v-if="materials.length > 0">
      <view
        v-for="f in filters"
        :key="f.key"
        class="filter-item"
        :class="{ active: activeFilter === f.key }"
        @tap="activeFilter = f.key"
      >
        <text>{{ f.label }}</text>
      </view>
    </view>

    <!-- 素材网格 -->
    <view class="materials-grid" v-if="filteredMaterials.length > 0">
      <view
        v-for="mat in filteredMaterials"
        :key="mat.id"
        class="material-card"
        @tap="previewMaterial(mat)"
        @longpress="onLongPress(mat)"
      >
        <image :src="mat.url" class="material-img" mode="aspectFill" />
        <view class="material-overlay">
          <text class="material-name">{{ mat.filename }}</text>
        </view>
        <view class="material-actions" v-if="selectedId === mat.id">
          <view class="action-btn delete" @tap.stop="deleteMaterial(mat)">
            <text>删除</text>
          </view>
          <view class="action-btn use" @tap.stop="useMaterial(mat)">
            <text>使用</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📁</text>
      <text class="empty-title">素材库为空</text>
      <text class="empty-desc">上传照片或设计素材，方便随时取用</text>
      <view class="btn-upload" @tap="addMaterial">
        <text>立即上传</text>
      </view>
    </view>

    <!-- 预览弹窗 -->
    <view class="preview-modal" v-if="previewUrl" @tap="closePreview">
      <image :src="previewUrl" class="preview-img" mode="aspectFit" @tap.stop />
      <view class="preview-bar" @tap.stop>
        <view class="preview-btn" @tap="closePreview">
          <text>关闭</text>
        </view>
        <view class="preview-btn primary" @tap="useMaterial(previewMat)">
          <text>使用此素材</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getUploadUrl } from '@/api'

interface Material {
  id: string
  url: string
  filename: string
  size: number
  created_at: string
  type: string
}

const materials = ref<Material[]>([])
const activeFilter = ref('all')
const selectedId = ref('')
const previewUrl = ref('')
const previewMat = ref<Material | null>(null)

const filters = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'design', label: '设计稿' },
]

const filteredMaterials = computed(() => {
  if (activeFilter.value === 'all') return materials.value
  return materials.value.filter(m => m.type === activeFilter.value)
})

function addMaterial() {
  uni.chooseImage({
    count: 3,
    sizeType: ['compressed', 'original'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      const uploaded: Material[] = []
      for (const path of res.tempFilePaths) {
        try {
          const url = await uploadFile(path)
          if (url) {
            const ext = path.split('.').pop()?.toLowerCase() || 'png'
            const mat: Material = {
              id: 'mat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
              url,
              filename: path.split('/').pop() || 'untitled.' + ext,
              size: 0,
              created_at: new Date().toISOString(),
              type: ext === 'png' || ext === 'jpg' || ext === 'jpeg' ? 'image' : 'design',
            }
            uploaded.push(mat)
          }
        } catch {
          // continue
        }
      }
      // Save uploaded files to localStorage
      if (uploaded.length > 0) {
        const cached = uni.getStorageSync('materials') || '[]'
        try {
          const existing: Material[] = JSON.parse(cached)
          materials.value = [...uploaded, ...existing]
        } catch {
          materials.value = uploaded
        }
        saveMaterials()
      }
      uni.hideLoading()
    },
  })
}

function uploadFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: getUploadUrl(),
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`上传失败 ${res.statusCode}`))
          return
        }
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          const url = data?.url || data?.file_url || data?.image_url || data?.path || data?.data?.url || ''
          if (!url) reject(new Error(data?.detail || data?.error || '上传失败，未返回文件地址'))
          else resolve(url)
        } catch {
          reject(new Error('上传响应解析失败'))
        }
      },
      fail: reject,
    })
  })
}

function fetchMaterials() {
  // For now, materials are fetched from localStorage as a simple cache
  // A backend endpoint would be ideal for production
  const cached = uni.getStorageSync('materials') || '[]'
  try {
    materials.value = JSON.parse(cached)
  } catch {
    materials.value = []
  }
}

function saveMaterials() {
  uni.setStorageSync('materials', JSON.stringify(materials.value))
}

function previewMaterial(mat: Material) {
  previewUrl.value = mat.url
  previewMat.value = mat
}

function closePreview() {
  previewUrl.value = ''
  previewMat.value = null
}

function onLongPress(mat: Material) {
  selectedId.value = selectedId.value === mat.id ? '' : mat.id
}

function deleteMaterial(mat: Material) {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除该素材吗？',
    success: (res) => {
      if (res.confirm) {
        materials.value = materials.value.filter(m => m.id !== mat.id)
        saveMaterials()
        selectedId.value = ''
        uni.showToast({ title: '已删除', icon: 'none' })
      }
    },
  })
}

function useMaterial(mat: Material) {
  closePreview()
  uni.navigateTo({
    url: `/pages/editor/editor?source_url=${encodeURIComponent(mat.url)}`,
  })
}

onShow(() => {
  fetchMaterials()
})

onPullDownRefresh(() => {
  fetchMaterials()
  uni.stopPullDownRefresh()
})
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度激光雕刻 · 素材管理与上传',
      path: '/pages/materials/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 素材库',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-materials {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
}

.upload-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx;
  background: $bg-card;
  border: 3rpx dashed rgba($primary, 0.2);
  border-radius: $radius-md;
  margin-bottom: 20rpx;

  &:active { background: $bg-card-hover; }
}

.upload-icon {
  font-size: 40rpx;
  color: $primary;
  font-weight: 300;
}

.upload-label {
  font-size: 26rpx;
  color: $primary;
}

.filter-bar {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.filter-item {
  padding: 12rpx 28rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: $text-secondary;
  background: $bg-card;

  &.active {
    color: $primary;
    background: rgba($primary, 0.1);
  }
}

.materials-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12rpx;
}

.material-card {
  position: relative;
  border-radius: $radius-sm;
  overflow: hidden;
  aspect-ratio: 1;
  background: $bg-card;

  &:active { opacity: 0.8; }
}

.material-img {
  width: 100%;
  height: 100%;
  display: block;
}

.material-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12rpx;
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
}

.material-name {
  font-size: 20rpx;
  color: #fff;
}

.material-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.action-btn {
  padding: 10rpx 32rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  width: 120rpx;
  text-align: center;

  &.delete {
    background: rgba(239,68,68,0.9);
    color: #fff;
  }

  &.use {
    background: rgba($primary, 0.9);
    color: #fff;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  gap: 12rpx;
}

.empty-icon { font-size: 80rpx; }
.empty-title { font-size: 30rpx; font-weight: 700; color: $text-primary; }
.empty-desc { font-size: 24rpx; color: $text-secondary; }

.btn-upload {
  margin-top: 20rpx;
  padding: 16rpx 48rpx;
  background: $primary;
  border-radius: $radius-md;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;

  &:active { opacity: 0.8; }
}

/* Preview Modal */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.95);
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.preview-img {
  flex: 1;
  width: 100%;
}

.preview-bar {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.preview-btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: $radius-md;
  font-size: 28rpx;
  color: #fff;
  border: 2rpx solid rgba(255,255,255,0.3);

  &.primary {
    background: $primary;
    border-color: $primary;
    font-weight: 600;
  }

  &:active { opacity: 0.7; }
}
</style>
