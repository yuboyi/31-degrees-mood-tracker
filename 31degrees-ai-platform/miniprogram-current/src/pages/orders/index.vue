<template>
  <view class="page-orders">
    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view
        class="tab-item"
        :class="{ active: currentTab === 'normal' }"
        @tap="switchTab('normal')"
      >
        <text>喷墨彩印</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: currentTab === 'machine' }"
        @tap="switchTab('machine')"
      >
        <text>激光雕刻</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: currentTab === 'proofing' }"
        @tap="switchTab('proofing')"
      >
        <text>打样复核</text>
      </view>
    </view>

    <!-- 喷墨彩印订单 -->
    <scroll-view
      v-if="currentTab === 'normal'"
      scroll-y
      class="order-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="normalOrders.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无彩印订单</text>
        <text class="empty-hint">选择模板开始制作吧</text>
      </view>

      <view
        v-for="order in normalOrders"
        :key="'n_' + order.id"
        class="order-card"
        @tap="goOrderDetail(order, 'normal')"
      >
        <view class="order-header">
          <text class="order-number">#{{ order.id }}</text>
          <view class="order-status" :class="'status-' + order.status">
            <text>{{ statusLabel(order.status) }}</text>
          </view>
        </view>

        <view class="order-body">
          <image
            v-if="order.image_url"
            :src="order.image_url"
            class="order-thumb"
            mode="aspectFill"
          />
          <view class="order-info">
            <text class="order-name">{{ order.template_name || '自定义制作' }}</text>
            <text class="order-store" v-if="order.store_name">{{ order.store_name }}</text>
            <text class="order-time">{{ formatTime(order.created_at) }}</text>
          </view>
        </view>

        <view class="order-footer">
          <text class="order-cost">{{ order.points_cost }} 积分</text>
          <text class="order-mode">{{ order.deduction_mode === 'store' ? '门店代付' : '自付' }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 人工复核打样订单 -->
    <scroll-view
      v-if="currentTab === 'proofing'"
      scroll-y
      class="order-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="proofingOrders.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">🧪</text>
        <text class="empty-text">暂无打样复核单</text>
        <text class="empty-hint">高风险或本机预览作品会先进入人工复核</text>
      </view>

      <view
        v-for="order in proofingOrders"
        :key="'p_' + order.id"
        class="order-card"
        @tap="goOrderDetail(order, 'proofing')"
      >
        <view class="order-header">
          <text class="order-number">复核 #{{ order.id }}</text>
          <view class="order-status machine-review">
            <text>{{ proofingStatusLabel(order.status) }}</text>
          </view>
        </view>
        <view class="order-body">
          <image
            v-if="order.depth_url || order.pod3d_url || order.source_url"
            :src="order.depth_url || order.pod3d_url || order.source_url"
            class="order-thumb"
            mode="aspectFill"
          />
          <view class="order-info">
            <text class="order-name">{{ order.title || '2.5D打样复核' }}</text>
            <text class="order-detail">{{ order.material }} · {{ order.size }} · {{ order.craft }}</text>
            <text class="order-time">{{ formatTime(order.created_at) }}</text>
          </view>
        </view>
        <view class="order-footer">
          <text class="order-detail">风险分 {{ order.craft_risk_score ?? '-' }}/100</text>
          <text class="order-mode">不会直接下发设备</text>
        </view>
      </view>
    </scroll-view>

    <!-- 激光雕刻订单 -->
    <scroll-view
      v-if="currentTab === 'machine'"
      scroll-y
      class="order-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="machineOrders.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">⚡</text>
        <text class="empty-text">暂无雕刻订单</text>
        <text class="empty-hint">扫描设备二维码开始雕刻</text>
      </view>

      <view
        v-for="order in machineOrders"
        :key="'m_' + order.id"
        class="order-card"
        @tap="goOrderDetail(order, 'machine')"
      >
        <view class="order-header">
          <text class="order-number">#{{ order.id }}</text>
          <view class="order-status" :class="'machine-' + order.status">
            <text>{{ machineStatusLabel(order.status) }}</text>
          </view>
        </view>

        <view class="order-body">
          <image
            v-if="order.source_image_url"
            :src="order.source_image_url"
            class="order-thumb"
            mode="aspectFill"
          />
          <image
            v-else-if="order.processed_image_url"
            :src="order.processed_image_url"
            class="order-thumb"
            mode="aspectFill"
          />
          <view class="order-info">
            <text class="order-name">{{ order.template_id ? '模板制作' : '自由上传' }}</text>
            <text class="order-detail" v-if="order.material_type">{{ materialMap[order.material_type] || order.material_type }}</text>
            <text class="order-detail" v-if="order.gift_message">礼物: {{ order.gift_message }}</text>
            <text class="order-time">{{ formatTime(order.created_at) }}</text>
          </view>
        </view>

        <view class="order-footer">
          <text class="order-cost">{{ order.points_cost }} 积分</text>
          <view class="order-ai-tag" v-if="order.ai_processing_type">
            <text>{{ aiMap[order.ai_processing_type] || order.ai_processing_type }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '@/api'

const currentTab = ref('normal')
const normalOrders = ref<any[]>([])
const machineOrders = ref<any[]>([])
const proofingOrders = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)

const statusLabelMap: Record<string, string> = {
  completed: '已完成',
  failed: '失败',
  refunded: '已退款',
}

const machineStatusMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  ready: '待打印',
  sent: '已发送',
  printed: '已完成',
  failed: '处理失败',
}

const proofingStatusMap: Record<string, string> = {
  manual_review: '待人工复核',
  reviewing: '技术复核中',
  approved: '已确认待加工',
  rejected: '已退回修改',
}

const materialMap: Record<string, string> = {
  crystal: '水晶',
  acrylic: '亚克力',
  wood: '木质',
  metal: '金属',
  leaf: '树叶',
}

const aiMap: Record<string, string> = {
  vector: '矢量雕刻',
  depth: '深度浮雕',
  logo_extract: '智能抠图',
  composite: '全能优化',
  pod_3d: '3D内雕',
}

function statusLabel(s: string): string {
  return statusLabelMap[s] || s
}

function machineStatusLabel(s: string): string {
  return machineStatusMap[s] || s
}

function proofingStatusLabel(s: string): string {
  return proofingStatusMap[s] || s
}

function formatTime(t: string | null): string {
  if (!t) return '-'
  try {
    const d = new Date(t)
    const m = d.getMonth() + 1
    const day = d.getDate()
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${m}-${day} ${h}:${min}`
  } catch {
    return t
  }
}

function switchTab(tab: string) {
  currentTab.value = tab
  if (tab === 'normal' && normalOrders.value.length === 0) {
    fetchNormalOrders()
  } else if (tab === 'machine' && machineOrders.value.length === 0) {
    fetchMachineOrders()
  } else if (tab === 'proofing' && proofingOrders.value.length === 0) {
    fetchProofingOrders()
  }
}

async function fetchNormalOrders() {
  try {
    const res: any = await api.orders.list()
    normalOrders.value = res.orders || []
  } catch {
    // offline fallback
  }
}

async function fetchMachineOrders() {
  try {
    const res: any = await api.machine.listOrders()
    machineOrders.value = res.orders || []
  } catch {
    // offline fallback
  }
}

async function fetchProofingOrders() {
  try {
    const res: any = await api.proofing.list()
    proofingOrders.value = res.orders || []
  } catch {
    // Offline fallback remains in local mock_sample_orders on the submit page.
  }
}

async function onRefresh() {
  refreshing.value = true
  try {
    if (currentTab.value === 'normal') {
      await fetchNormalOrders()
    } else if (currentTab.value === 'machine') {
      await fetchMachineOrders()
    } else {
      await fetchProofingOrders()
    }
  } finally {
    refreshing.value = false
  }
}

function goOrderDetail(order: any, type: string) {
  if (type === 'machine') {
    uni.navigateTo({ url: `/pages/machine/status?id=${order.id}` })
  } else if (type === 'proofing') {
    uni.showModal({
      title: `复核单 #${order.id}`,
      content: [
        `作品: ${order.title || '-'}`,
        `材料/尺寸: ${order.material || '-'} / ${order.size || '-'}`,
        `工艺: ${order.craft || '-'}`,
        `状态: ${proofingStatusLabel(order.status)}`,
        `结论: ${order.review_reason || '等待技术复核'}`,
        '安全边界: 不会直接下发设备。',
      ].join('\n'),
      showCancel: false,
      confirmText: '知道了',
    })
  } else {
    // Show order detail in a modal
    uni.showModal({
      title: `订单 #${order.id}`,
      content: [
        `模板: ${order.template_name || '自定义制作'}`,
        `门店: ${order.store_name || '未绑定'}`,
        `积分: ${order.points_cost}`,
        `状态: ${statusLabel(order.status)}`,
        `时间: ${formatTime(order.created_at)}`,
        `付款方式: ${order.deduction_mode === 'store' ? '门店代付' : '自付积分'}`,
      ].join('\n'),
      showCancel: false,
      confirmText: '知道了',
    })
  }
}

onShow(() => {
  fetchNormalOrders()
})
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '我的激光雕刻订单 · 31度科技',
      path: '/pages/orders/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 订单管理与历史记录',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-orders {
  min-height: 100vh;
  background: $bg-dark;
  display: flex;
  flex-direction: column;
}

.tab-bar {
  display: flex;
  background: $bg-card;
  padding: 0 24rpx;
  border-bottom: 1rpx solid $border-subtle;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: $text-secondary;
  position: relative;

  &.active {
    color: $primary;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 4rpx;
      background: $primary;
      border-radius: 2rpx;
    }
  }
}

.order-scroll {
  flex: 1;
  padding: 16rpx 24rpx;
}

.order-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-card;

  &:active { opacity: 0.8; }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.order-number {
  font-size: 24rpx;
  color: $text-secondary;
  font-weight: 500;
}

.order-status {
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 600;

  &.status-completed { background: rgba(16,185,129,0.1); color: $success; }
  &.status-failed { background: rgba(239,68,68,0.1); color: $danger; }
  &.status-refunded { background: rgba(153,153,153,0.1); color: $text-muted; }

  &.machine-pending { background: rgba(245,158,11,0.1); color: $warning; }
  &.machine-processing { background: rgba($primary, 0.15); color: $primary; }
  &.machine-ready { background: rgba(16,185,129,0.1); color: $success; }
  &.machine-sent { background: rgba($primary, 0.12); color: $primary; }
  &.machine-printed { background: rgba(16,185,129,0.15); color: $success; }
  &.machine-failed { background: rgba(239,68,68,0.1); color: $danger; }
}

.order-body {
  display: flex;
  gap: 16rpx;
}

.order-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: $radius-sm;
  background: $bg-dark;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.order-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
}

.order-store {
  font-size: 22rpx;
  color: $text-secondary;
}

.order-detail {
  font-size: 22rpx;
  color: $text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-time {
  font-size: 20rpx;
  color: $text-muted;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid $border-subtle;
}

.order-cost {
  font-size: 26rpx;
  font-weight: 700;
  color: $accent;
}

.order-mode {
  font-size: 22rpx;
  color: $primary;
}

.order-ai-tag {
  padding: 2rpx 12rpx;
  background: rgba($primary, 0.08);
  border-radius: 8rpx;
  font-size: 20rpx;
  color: $primary;
}

.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0;
  gap: 12rpx;
}

.empty-icon { font-size: 64rpx; }
.empty-text { font-size: 28rpx; color: $text-secondary; }
.empty-hint { font-size: 24rpx; color: $text-muted; }
.loading-state text { font-size: 28rpx; color: $text-secondary; }
</style>
