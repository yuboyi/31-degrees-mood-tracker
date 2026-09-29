<template>
  <view class="page-works">
    <view v-if="loadError" class="load-error" @tap="fetchTasks">
      <text>{{ loadError }} · 点击重试</text>
    </view>
    <!-- Empty State -->
    <view class="empty-state" v-if="tasks.length === 0 && !loading && !loadError">
      <text class="empty-icon">📭</text>
      <text class="empty-title">暂无作品</text>
      <text class="empty-desc">处理后的结果会展示在这里</text>
      <button class="btn-start" @tap="goCreate">开始创作</button>
    </view>

    <!-- Task List -->
    <view class="task-list" v-else>
      <view
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        @tap="viewTask(task)"
      >
        <image
          :src="task.source_image_url"
          class="task-thumb"
          mode="aspectFill"
        />

        <view class="task-info">
          <view class="task-header">
            <text class="task-type">{{ typeLabel(task.task_type) }}</text>
            <text class="task-status" :class="task.status">
              {{ statusLabel(task.status) }}
            </text>
          </view>

          <text class="task-meta" v-if="task.frame_count">
            {{ task.frame_count }} 帧
            <text v-if="task.duration"> · {{ task.duration }}s</text>
          </text>
          <text class="task-meta" v-else-if="task.task_type === 'photo-job'">
            {{ task.template_type_name || 'AI照片定制' }} · {{ task.production_status_label || '预览链路' }}
          </text>

          <text class="task-time">{{ formatTime(task.created_at) }}</text>

          <!-- Error message -->
          <view class="task-error" v-if="task.status === 'failed' && task.error_message">
            <text class="error-msg">{{ task.error_message }}</text>
          </view>
        </view>

        <!-- Download button for completed tasks -->
        <view class="task-actions" v-if="task.status === 'completed' && !task.photo_job_id">
          <view class="action-btn" @tap.stop="downloadResult(task)">
            <text>下载</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Loading -->
    <view class="loading-state" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Pull to refresh indicator -->
    <view class="refresh-hint" v-if="tasks.length > 0">
      <text class="hint-text">下拉刷新</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { api, getApiBaseUrl } from '@/api'

const tasks = ref<any[]>([])
const loading = ref(true)
const loadError = ref('')

onShow(() => {
  fetchTasks()
})

async function fetchTasks() {
  loading.value = true
  loadError.value = ''
  try {
    const results = await Promise.allSettled([
      api.processing.getTasks(50),
      api.photoJobs.list(),
    ])
    const processingRes: any = results[0].status === 'fulfilled' ? results[0].value : null
    const photoRes: any = results[1].status === 'fulfilled' ? results[1].value : null
    const processingTasks = processingRes?.tasks || []
    const photoTasks = (photoRes?.jobs || []).map(normalizePhotoJob)
    tasks.value = [...photoTasks, ...processingTasks].sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || '')),
    )
    if (results.some((result) => result.status === 'rejected')) {
      loadError.value = results.every((result) => result.status === 'rejected')
        ? '作品读取失败，请确认登录和网络'
        : '部分作品暂未读取成功'
    }
  } catch {
    loadError.value = '作品读取失败，请重试'
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

onPullDownRefresh(() => {
  fetchTasks()
})

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    segment: '主体分割',
    'depth-map': '立体深度图',
    halftone: '点阵雕刻',
    layers: '分层雕刻',
    video: '视频雕刻',
    'pod-3d': '3D内雕',
    gcode: 'G-code',
    'photo-job': 'AI照片定制',
  }
  return map[type] || type
}

function normalizePhotoJob(job: any): any {
  const completed = ['preview_ready', 'awaiting_payment', 'production_submitted'].includes(job.status)
  const failed = job.status === 'failed'
  return {
    ...job,
    id: `photo-${job.id}`,
    photo_job_id: job.id,
    task_type: 'photo-job',
    source_image_url: job.source_image_url,
    result_url: job.pod3d_url || job.optimized_image_url,
    status: failed ? 'failed' : completed ? 'completed' : 'processing',
    production_status_label: productionStatusLabel(job.production_status),
  }
}

function productionStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '待锁定',
    awaiting_payment: '待支付',
    material_pending: '待备料',
    ready: '可生产',
    submitted: '已提交生产',
  }
  return map[status] || '处理中'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

function formatTime(iso: string): string {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 19)
}

function goCreate() {
  uni.navigateTo({ url: '/pages/create/index' })
}

function viewTask(task: any) {
  if (task.photo_job_id) {
    uni.navigateTo({ url: `/pages/photobooth/index?photo_job_id=${task.photo_job_id}` })
    return
  }
  if (task.status === 'completed' && task.result_url) {
    uni.previewImage({
      urls: [task.result_url],
      current: task.result_url,
    })
  } else if (task.status === 'failed') {
    uni.showToast({ title: task.error_message || '处理失败', icon: 'none' })
  } else if (task.task_type === 'photo-job' && task.photo_job_id) {
    uni.navigateTo({ url: `/pages/photobooth/index?photo_job_id=${task.photo_job_id}` })
  } else {
    uni.showToast({ title: '处理中，请稍候', icon: 'none' })
  }
}

async function downloadResult(task: any) {
  if (!task.result_url) {
    uni.showToast({ title: '文件不可用', icon: 'none' })
    return
  }
  uni.showLoading({ title: '下载中...' })
  try {
    const token = uni.getStorageSync('token')
    const url = `${getApiBaseUrl()}/processing/download/${task.id}`
    await new Promise<void>((resolve, reject) => {
      uni.downloadFile({
        url,
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (res: any) => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`下载失败 ${res.statusCode}`))
            return
          }
          uni.saveFile({
            tempFilePath: res.tempFilePath,
            success: () => resolve(),
            fail: reject,
          })
        },
        fail: reject,
      })
    })
    uni.hideLoading()
    uni.showToast({ title: '文件已保存', icon: 'success' })
  } catch {
    uni.hideLoading()
    // Fallback: preview image for save
    uni.previewImage({
      urls: [task.result_url],
      success: () => {
        uni.showToast({ title: '长按可保存', icon: 'none' })
      },
    })
  }
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '我的激光雕刻作品集 - 31度科技',
      path: '/pages/works/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 查看我的作品集',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-works {
  min-height: 100vh;
  background: $bg-dark;
}

.load-error {
  padding: 24rpx;
  color: $danger;
  font-size: 24rpx;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx 0;
  gap: 12rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
}

.empty-desc {
  font-size: 24rpx;
  color: $text-secondary;
}

.btn-start {
  margin-top: 24rpx;
  background: $primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  border-radius: 32rpx;
  padding: 18rpx 48rpx;
}

.task-list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.task-card {
  background: $bg-card;
  border-radius: $radius-md;
  overflow: hidden;
  display: flex;
  box-shadow: $shadow-card;

  &:active { opacity: 0.8; }
}

.task-thumb {
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
}

.task-info {
  flex: 1;
  padding: 16rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-type {
  font-size: 26rpx;
  font-weight: 700;
  color: $text-primary;
}

.task-status {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 10rpx;
  font-weight: 600;

  &.completed {
    background: rgba($success, 0.1);
    color: $success;
  }

  &.failed {
    background: rgba($danger, 0.1);
    color: $danger;
  }

  &.processing, &.pending {
    background: rgba($primary, 0.1);
    color: $primary;
  }
}

.task-meta {
  font-size: 22rpx;
  color: $text-secondary;
}

.task-time {
  font-size: 20rpx;
  color: $text-muted;
}

.task-error {
  margin-top: 4rpx;
}

.error-msg {
  font-size: 20rpx;
  color: $danger;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-actions {
  display: flex;
  align-items: flex-end;
  padding: 16rpx 12rpx;
}

.action-btn {
  padding: 8rpx 20rpx;
  background: rgba($primary, 0.1);
  border-radius: 16rpx;

  text {
    font-size: 22rpx;
    color: $primary;
    font-weight: 600;
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 26rpx;
  color: $text-secondary;
}

.refresh-hint {
  text-align: center;
  padding: 24rpx 0 40rpx;
}

.hint-text {
  font-size: 22rpx;
  color: $text-muted;
}
</style>
