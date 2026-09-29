<template>
  <view class="page-store">
    <!-- 门店信息 -->
    <view v-if="storeInfo" class="store-card">
      <view class="store-header">
        <text class="store-name">{{ storeInfo.name }}</text>
        <view class="store-badge">管理员</view>
      </view>
      <view class="store-stats">
        <view class="stat-item">
          <text class="stat-value">{{ storeInfo.points_balance }}</text>
          <text class="stat-label">门店积分</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ members.length }}</text>
          <text class="stat-label">绑定客户</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ todayOrders }}</text>
          <text class="stat-label">今日消耗</text>
        </view>
      </view>
      <view class="store-actions">
        <view class="store-btn primary" @tap="goWithdraw">
          <text>积分提现</text>
        </view>
        <view class="store-btn" @tap="shareQRCode">
          <text>分享二维码</text>
        </view>
      </view>
    </view>

    <!-- 未注册门店 -->
    <view v-else class="store-empty">
      <text class="empty-icon">🏪</text>
      <text class="empty-title">您还未创建门店</text>
      <text class="empty-desc">创建门店后，客户扫码可使用您的门店积分</text>
      <view class="btn-create" @tap="createStore">
        <text>创建门店</text>
      </view>
    </view>

    <!-- 设备管理 -->
    <view class="section" v-if="storeInfo">
      <text class="section-title">雕刻设备 ({{ machines.length }})</text>
      <view v-if="machines.length > 0" class="machine-list">
        <view v-for="m in machines" :key="m.id" class="machine-row" @tap="goMachine(m.id)">
          <view class="machine-info">
            <view class="machine-dot" :class="m.status" />
            <view class="machine-text">
              <text class="machine-name">{{ m.name }}</text>
              <text class="machine-code">{{ m.machine_code }}</text>
            </view>
          </view>
          <view class="machine-right">
            <text class="machine-orders" v-if="m.pending_orders">{{ m.pending_orders }} 待处理</text>
            <text class="machine-arrow">→</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-mini">
        <text class="empty-mini-text">暂无设备</text>
      </view>
      <view class="btn-add-machine" @tap="goRegisterMachine">
        <text>+ 注册新设备</text>
      </view>
    </view>

    <!-- 客户消耗记录 -->
    <view class="section">
      <text class="section-title">客户消耗记录</text>
      <view v-if="orders.length > 0" class="order-list">
        <view v-for="o in orders" :key="o.id" class="order-item">
          <view class="order-left">
            <text class="order-user">{{ o.user_nickname || '客户' + o.user_id }}</text>
            <text class="order-template">{{ o.template_name }}</text>
            <text class="order-time">{{ o.created_at?.slice(0, 16) }}</text>
          </view>
          <text class="order-cost">-{{ o.points_cost }}</text>
        </view>
      </view>
      <view v-else class="empty-small">
        <text class="empty-text">暂无消耗记录</text>
      </view>
    </view>

    <!-- 绑定客户列表 -->
    <view class="section">
      <text class="section-title">绑定客户 ({{ members.length }})</text>
      <view v-if="members.length > 0" class="member-list">
        <view v-for="m in members" :key="m.id" class="member-item">
          <view class="member-left">
            <text class="member-name">{{ m.user_nickname || '客户' + m.user_id }}</text>
            <text class="member-time">绑定于 {{ m.bound_at?.slice(0, 10) }}</text>
          </view>
          <text class="member-status" :class="{ expired: m.is_expired }">
            {{ m.is_expired ? '已过期' : '有效' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '@/api'

const storeInfo = ref<any>(null)
const members = ref<any[]>([])
const orders = ref<any[]>([])
const machines = ref<any[]>([])
const todayOrders = ref(0)

async function fetchStoreData() {
  try {
    const [infoRes, membersRes, ordersRes] = await Promise.all([
      api.store.info().catch(() => null),
      api.store.members().catch(() => []),
      api.store.orders().catch(() => [])
    ])
    storeInfo.value = infoRes as any
    members.value = (membersRes as any)?.members || (membersRes as any)?.data || []
    orders.value = (ordersRes as any)?.orders || (ordersRes as any)?.data || []
    // 计算今日消耗
    const today = new Date().toISOString().slice(0, 10)
    todayOrders.value = orders.value.filter((o: any) =>
      o.created_at?.startsWith(today)
    ).length

    // Fetch machines if store exists
    if (storeInfo.value) {
      fetchMachines(storeInfo.value.id)
    }
  } catch (e) {
    storeInfo.value = null
  }
}

onShow(() => {
  fetchStoreData()
})

function createStore() {
  uni.showModal({
    title: '创建门店',
    editable: true,
    placeholderText: '请输入门店名称',
    success: async (res: any) => {
      if (res.confirm && res.content) {
        uni.showLoading({ title: '创建中...' })
        try {
          await api.store.create(res.content)
          uni.hideLoading()
          uni.showToast({ title: '创建成功', icon: 'success' })
          fetchStoreData()
        } catch (e: any) {
          uni.hideLoading()
          uni.showToast({ title: e.message || '创建失败', icon: 'none' })
        }
      }
    }
  })
}

function goWithdraw() {
  uni.navigateTo({ url: '/pages/store/withdraw' })
}

function shareQRCode() {
  if (!storeInfo.value) return
  // Navigate to QR code page to generate and share store QR code
  uni.navigateTo({
    url: `/pages/qrcode/index?type=store&id=${storeInfo.value.id}&name=${encodeURIComponent(storeInfo.value.name || '')}`
  })
}

async function fetchMachines(storeId: number) {
  try {
    const res: any = await api.machine.listByStore(storeId)
    machines.value = res.machines || res.data || []
  } catch (e) {
    // ignore
  }
}

function goMachine(id: number) {
  uni.navigateTo({ url: `/pages/store/machine-detail?id=${id}` })
}

function goRegisterMachine() {
  if (!storeInfo.value) return
  uni.showModal({
    title: '注册新设备',
    editable: true,
    placeholderText: '设备名称',
    success: async (res2: any) => {
      if (res2.confirm && res2.content) {
        const code = 'MC' + Date.now().toString(36).toUpperCase()
        try {
          uni.showLoading({ title: '注册中...' })
          await api.machine.register({
            store_id: storeInfo.value.id,
            name: res2.content,
            machine_code: code,
            machine_type: '内雕机',
          })
          uni.hideLoading()
          uni.showToast({ title: '注册成功', icon: 'success' })
          fetchMachines(storeInfo.value.id)
        } catch (e: any) {
          uni.hideLoading()
          uni.showToast({ title: e.message || '注册失败', icon: 'none' })
        }
      }
    }
  })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度激光雕刻门店 · 照片定制打印与激光雕刻',
      path: '/pages/store/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 门店服务',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-store {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
}

.store-card {
  background: linear-gradient(135deg, rgba($primary, 0.15), rgba(239,68,68,0.08));
  border-radius: $radius-lg;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid rgba($primary, 0.15);
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.store-name {
  font-size: 36rpx;
  font-weight: 700;
}

.store-badge {
  font-size: 20rpx;
  background: rgba($primary, 0.12);
  color: $primary;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.store-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid $border-subtle;
  border-bottom: 1rpx solid $border-subtle;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 800;
  color: $primary;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: $text-secondary;
  margin-top: 4rpx;
  display: block;
}

.store-actions {
  display: flex;
  gap: 16rpx;
}

.store-btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: $radius-md;
  background: $bg-card-hover;
  color: $text-primary;
  font-size: 26rpx;

  &.primary {
    background: $primary;
    color: #fff;
    font-weight: 600;
  }
}

.store-empty {
  text-align: center;
  padding: 80rpx 40rpx;
  background: $bg-card;
  border-radius: $radius-lg;
  margin-bottom: 24rpx;
}

.empty-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 24rpx;
  color: $text-secondary;
  display: block;
  margin-bottom: 24rpx;
}

.btn-create {
  display: inline-block;
  padding: 16rpx 48rpx;
  background: $primary;
  color: #fff;
  font-weight: 600;
  font-size: 28rpx;
  border-radius: $radius-md;
}

.section {
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

/* Machine List */
.machine-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.machine-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: $bg-dark;
  border-radius: $radius-sm;

  &:active { opacity: 0.7; }
}

.machine-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.machine-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;

  &.online { background: $success; }
  &.offline { background: $text-muted; }
  &.maintenance { background: $warning; }
}

.machine-text {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.machine-name {
  font-size: 26rpx;
  font-weight: 600;
}

.machine-code {
  font-size: 20rpx;
  color: $text-secondary;
}

.machine-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.machine-orders {
  font-size: 20rpx;
  color: $accent;
  background: rgba($accent, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.machine-arrow {
  font-size: 24rpx;
  color: $text-muted;
}

.btn-add-machine {
  text-align: center;
  padding: 16rpx 0;
  font-size: 24rpx;
  color: $primary;
  border: 2rpx dashed rgba($primary, 0.3);
  border-radius: $radius-md;
}

.empty-mini {
  text-align: center;
  padding: 16rpx 0;
  margin-bottom: 8rpx;
}

.empty-mini-text {
  font-size: 22rpx;
  color: $text-muted;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid $border-subtle;
}

.order-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.order-user { font-size: 26rpx; }

.order-template {
  font-size: 22rpx;
  color: $text-secondary;
}

.order-time {
  font-size: 20rpx;
  color: $text-muted;
}

.order-cost {
  font-size: 28rpx;
  color: $danger;
  font-weight: 600;
}

.member-list {
  display: flex;
  flex-direction: column;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $border-subtle;
}

.member-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.member-name { font-size: 26rpx; }

.member-time {
  font-size: 20rpx;
  color: $text-muted;
}

.member-status {
  font-size: 22rpx;
  color: $success;
  padding: 4rpx 16rpx;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20rpx;

  &.expired {
    color: $text-secondary;
    background: $bg-card-hover;
  }
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
