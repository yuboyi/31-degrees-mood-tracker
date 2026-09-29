<template>
  <view class="page-machine-detail">
    <!-- 加载中 -->
    <view class="loading-center" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <template v-else-if="machine">
      <!-- 机器信息卡片 -->
      <view class="info-card">
        <view class="info-header">
          <view class="info-status" :class="machine.status">
            <view class="status-dot" />
            <text>{{ statusLabel }}</text>
          </view>
          <text class="info-type">{{ machine.machine_type }}</text>
        </view>
        <text class="info-name">{{ machine.name }}</text>
        <text class="info-code">设备码：{{ machine.machine_code }}</text>

        <view class="info-grid">
          <view class="info-item">
            <text class="info-item-label">IP 地址</text>
            <text class="info-item-value">{{ machine.ip_address || '未配置' }}</text>
          </view>
          <view class="info-item">
            <text class="info-item-label">端口</text>
            <text class="info-item-value">{{ machine.port }}</text>
          </view>
          <view class="info-item">
            <text class="info-item-label">最后心跳</text>
            <text class="info-item-value">{{ heartbeatText }}</text>
          </view>
          <view class="info-item">
            <text class="info-item-label">待处理订单</text>
            <text class="info-item-value highlight">{{ machine.pending_orders || 0 }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="info-actions">
          <view class="btn-action secondary" @tap="handleToggleStatus">
            <text>{{ machine.status === 'online' ? '设为离线' : '设为在线' }}</text>
          </view>
          <view class="btn-action danger" @tap="handleDelete">
            <text>删除设备</text>
          </view>
        </view>
      </view>

      <!-- 订单列表 -->
      <view class="orders-section">
        <text class="section-title">最近订单</text>
        <view v-if="orders.length > 0" class="order-list">
          <view v-for="o in orders" :key="o.id" class="order-item">
            <view class="order-top">
              <text class="order-id">#{{ o.id }}</text>
              <text class="order-status" :class="o.status">{{ statusMap[o.status] || o.status }}</text>
            </view>
            <view class="order-mid">
              <text class="order-cost">{{ o.points_cost }} 积分</text>
              <text class="order-time">{{ o.created_at || '-' }}</text>
            </view>
            <view class="order-bottom" v-if="o.error_message">
              <text class="order-error">{{ o.error_message }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-small">
          <text class="empty-text">暂无订单</text>
        </view>
      </view>

      <!-- 注册新机器入口（store admin） -->
      <view class="register-section">
        <text class="section-title">设备二维码</text>
        <image
          v-if="machine.qrcode_url"
          :src="machine.qrcode_url"
          class="qr-image"
          mode="aspectFit"
        />
        <text class="qr-hint" v-if="machine.qrcode_url">用户扫码直接进入该设备页面</text>
        <text class="qr-hint" v-else>设备注册后自动生成二维码</text>
      </view>
    </template>

    <!-- 未找到 -->
    <view class="error-center" v-else>
      <text class="error-text">设备不存在或已删除</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/api'

const machine = ref<any>(null)
const orders = ref<any[]>([])
const loading = ref(true)

const statusMap: Record<string, string> = {
  'pending': '待处理',
  'processing': '处理中',
  'ready': '待打印',
  'sent': '已发送',
  'printed': '已完成',
  'failed': '失败',
}

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    'online': '在线',
    'offline': '离线',
    'maintenance': '维护中',
  }
  return map[machine.value?.status] || '未知'
})

const heartbeatText = computed(() => {
  const hb = machine.value?.last_heartbeat
  if (!hb) return '从未连接'
  return hb.slice(0, 16).replace('T', ' ')
})

onLoad((options: any) => {
  const id = parseInt(options?.id || '0')
  if (id) {
    fetchMachine(id)
  } else {
    loading.value = false
  }
})

async function fetchMachine(id: number) {
  try {
    const res: any = await api.machine.getDetail(id)
    machine.value = res
    orders.value = res.recent_orders || []
  } catch (e) {
    console.error('获取设备详情失败:', e)
  } finally {
    loading.value = false
  }
}

async function handleToggleStatus() {
  if (!machine.value) return
  const newStatus = machine.value.status === 'online' ? 'offline' : 'online'
  try {
    await api.machine.updateStatus(machine.value.id, newStatus)
    machine.value.status = newStatus
    uni.showToast({ title: '状态已更新', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

function handleDelete() {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除设备「${machine.value?.name}」吗？此操作不可恢复。`,
    success: async (res) => {
      if (res.confirm && machine.value) {
        try {
          await api.machine.delete(machine.value.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1500)
        } catch (e: any) {
          uni.showToast({ title: e.message || '删除失败', icon: 'none' })
        }
      }
    },
  })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31° 激光雕刻设备详情 · 查看设备状态与信息',
      path: '/pages/store/machine-detail',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 设备管理',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-machine-detail {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
}

.loading-center, .error-center {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text, .error-text {
  font-size: 28rpx;
  color: $text-secondary;
}

/* Info Card */
.info-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.info-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;

  &.online {
    background: rgba(16,185,129,0.1);
    color: $success;
    .status-dot { background: $success; }
  }
  &.offline {
    background: rgba(153,153,153,0.1);
    color: $text-muted;
    .status-dot { background: $text-muted; }
  }
  &.maintenance {
    background: rgba(245,158,11,0.1);
    color: $warning;
    .status-dot { background: $warning; }
  }
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
}

.info-type {
  font-size: 22rpx;
  color: $text-secondary;
}

.info-name {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 4rpx;
}

.info-code {
  font-size: 24rpx;
  color: $text-secondary;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-top: 24rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.info-item-label {
  font-size: 20rpx;
  color: $text-muted;
}

.info-item-value {
  font-size: 26rpx;
  font-weight: 500;

  &.highlight {
    color: $accent;
    font-weight: 700;
  }
}

.info-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.btn-action {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: $radius-md;
  font-size: 26rpx;

  &.secondary {
    background: $bg-card-hover;
  }
  &.danger {
    background: rgba(239,68,68,0.1);
    color: $danger;
  }

  &:active {
    opacity: 0.7;
  }
}

/* Orders */
.orders-section, .register-section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  display: block;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.order-item {
  padding: 16rpx;
  background: $bg-dark;
  border-radius: $radius-sm;
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.order-id {
  font-size: 24rpx;
  font-weight: 600;
  color: $primary;
}

.order-status {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 12rpx;

  &.pending, &.processing { background: rgba(220,38,38,0.15); color: $primary; }
  &.ready { background: rgba(16,185,129,0.1); color: $success; }
  &.sent { background: rgba(22,119,255,0.1); color: $primary; }
  &.printed { background: rgba(16,185,129,0.15); color: $success; }
  &.failed { background: rgba(239,68,68,0.1); color: $danger; }
}

.order-mid {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-cost {
  font-size: 22rpx;
  color: $accent;
}

.order-time {
  font-size: 20rpx;
  color: $text-muted;
}

.order-bottom {
  margin-top: 8rpx;
}

.order-error {
  font-size: 20rpx;
  color: $danger;
}

/* QR Code */
.qr-image {
  width: 300rpx;
  height: 300rpx;
  display: block;
  margin: 0 auto 12rpx;
  background: #fff;
  border-radius: 12rpx;
}

.qr-hint {
  text-align: center;
  font-size: 22rpx;
  color: $text-secondary;
  display: block;
}

.empty-small {
  text-align: center;
  padding: 32rpx 0;
}

.empty-text {
  font-size: 24rpx;
  color: $text-muted;
}
</style>
