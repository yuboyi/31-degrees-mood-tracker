<template>
  <view class="page-withdraw">
    <view class="withdraw-card">
      <text class="card-label">可提现积分</text>
      <text class="card-value">{{ storeInfo?.points_balance ?? 0 }}</text>
      <text class="card-hint">100积分 = 1元</text>
    </view>

    <view class="input-section">
      <text class="input-label">提现金额（积分）</text>
      <input
        v-model="amount"
        class="amount-input"
        type="number"
        placeholder="请输入提现积分数量"
        placeholder-style="color:#5a5a6e"
        @input="onAmountInput"
      />
      <text class="amount-rmb">≈ {{ (amountNum / 100).toFixed(2) }} 元</text>
    </view>

    <view class="info-section">
      <text class="info-title">提现说明</text>
      <text class="info-item">1. 100积分 = 1元人民币</text>
      <text class="info-item">2. 最低提现 1000 积分（10元）</text>
      <text class="info-item">3. 提现申请将在 1-3 个工作日内处理</text>
      <text class="info-item">4. 提现到微信零钱</text>
    </view>

    <view class="btn-submit" :class="{ disabled: !canSubmit }" @tap="doWithdraw">
      <text class="btn-text">申请提现</text>
    </view>

    <!-- 历史提现记录 -->
    <view class="history-section">
      <text class="history-title">提现记录</text>
      <view v-if="history.length > 0" class="history-list">
        <view v-for="h in history" :key="h.id" class="history-item">
          <view class="h-left">
            <text class="h-amount">{{ h.amount }} 积分</text>
            <text class="h-rmb">≈ {{ (h.amount / 100).toFixed(2) }} 元</text>
          </view>
          <view class="h-right">
            <text class="h-status" :class="statusClass(h.status)">{{ h.status_label }}</text>
            <text class="h-time">{{ h.created_at?.slice(0, 10) }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-small">
        <text class="empty-text">暂无提现记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '@/api'

const storeInfo = ref<any>(null)
const amount = ref('')
const history = ref<any[]>([])

const amountNum = computed(() => parseInt(amount.value) || 0)
const canSubmit = computed(() => amountNum.value >= 1000 && amountNum.value <= (storeInfo.value?.points_balance || 0))

async function fetchData() {
  try {
    const [infoRes, historyRes] = await Promise.all([
      api.store.info().catch(() => null),
      api.store.withdrawHistory().catch(() => [])
    ])
    storeInfo.value = infoRes as any
    history.value = (historyRes as any)?.withdrawals || (historyRes as any)?.data || []
  } catch (e) {
    // 无数据
  }
}

onShow(() => {
  fetchData()
})

function onAmountInput() {
  // 限制只能输入正整数
  const val = parseInt(amount.value)
  if (!isNaN(val) && val < 0) {
    amount.value = '0'
  }
}

async function doWithdraw() {
  if (!canSubmit.value) return

  uni.showModal({
    title: '确认提现',
    content: `确认提现 ${amountNum.value} 积分（约 ${(amountNum.value / 100).toFixed(2)} 元）？`,
    success: async (res: any) => {
      if (res.confirm) {
        uni.showLoading({ title: '提交中...' })
        try {
          await api.store.withdrawApply(amountNum.value)
          uni.hideLoading()
          uni.showToast({ title: '提现申请已提交', icon: 'success' })
          amount.value = ''
          // 刷新
          fetchData()
        } catch (e: any) {
          uni.hideLoading()
          uni.showToast({ title: e.message || '提交失败', icon: 'none' })
        }
      }
    }
  })
}

function statusClass(status: string) {
  return {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
    completed: 'status-completed'
  }[status] || 'status-pending'
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度激光雕刻 · 积分提现',
      path: '/pages/store/withdraw',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 积分兑换与提现',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-withdraw {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
}

.withdraw-card {
  text-align: center;
  background: linear-gradient(135deg, rgba($primary, 0.08), rgba(99,102,241,0.08));
  border-radius: $radius-lg;
  padding: 40rpx;
  margin-bottom: 24rpx;
}

.card-label {
  font-size: 24rpx;
  color: $text-secondary;
  display: block;
  margin-bottom: 12rpx;
}

.card-value {
  font-size: 64rpx;
  font-weight: 800;
  color: $primary;
  display: block;
}

.card-hint {
  font-size: 22rpx;
  color: $text-muted;
  margin-top: 8rpx;
  display: block;
}

.input-section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.input-label {
  font-size: 26rpx;
  color: $text-secondary;
  display: block;
  margin-bottom: 16rpx;
}

.amount-input {
  width: 100%;
  font-size: 40rpx;
  font-weight: 700;
  color: $text-primary;
  background: $bg-dark;
  padding: 20rpx;
  border-radius: $radius-sm;
  border: 1rpx solid $border-default;
}

.amount-rmb {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 12rpx;
  display: block;
}

.info-section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.info-title {
  font-size: 26rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 12rpx;
}

.info-item {
  font-size: 22rpx;
  color: $text-secondary;
  line-height: 2;
  display: block;
}

.btn-submit {
  width: 100%;
  padding: 28rpx 0;
  text-align: center;
  background: linear-gradient(135deg, $primary, #ef4444);
  border-radius: $radius-md;
  margin-bottom: 32rpx;

  &.disabled {
    opacity: 0.4;
  }
}

.btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 700;
}

.history-section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
}

.history-title {
  font-size: 26rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 16rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $border-subtle;
}

.h-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.h-amount { font-size: 26rpx; font-weight: 600; }
.h-rmb { font-size: 20rpx; color: $text-secondary; }

.h-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.h-status {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;

  &.status-pending { color: $warning; background: rgba(245,158,11,0.1); }
  &.status-approved { color: $primary; background: rgba($primary, 0.1); }
  &.status-completed { color: $success; background: rgba(16,185,129,0.1); }
  &.status-rejected { color: $danger; background: rgba(239,68,68,0.1); }
}

.h-time {
  font-size: 20rpx;
  color: $text-muted;
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
