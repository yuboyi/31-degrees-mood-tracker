<template>
  <view class="page-membership">
    <!-- 会员信息卡 -->
    <view class="member-card">
      <view class="member-top">
        <image
          v-if="userStore.userInfo?.avatar"
          :src="userStore.userInfo.avatar"
          class="member-avatar"
          mode="aspectFill"
        />
        <view v-else class="member-avatar placeholder">
          <text>👤</text>
        </view>
        <view class="member-info">
          <text class="member-name">{{ userStore.userInfo?.nickname || '未登录' }}</text>
          <view class="member-level">
            <text class="level-badge" :class="levelClass">{{ memberLevel }}</text>
          </view>
        </view>
      </view>

      <!-- 积分余额 -->
      <view class="points-row">
        <view class="points-item">
          <text class="points-value">{{ userStore.userInfo?.points_balance || 0 }}</text>
          <text class="points-label">可用积分</text>
        </view>
        <view class="points-divider" />
        <view class="points-item">
          <text class="points-value">{{ totalSpent }}</text>
          <text class="points-label">累计消费</text>
        </view>
        <view class="points-divider" />
        <view class="points-item">
          <text class="points-value">{{ orderCount }}</text>
          <text class="points-label">制作次数</text>
        </view>
      </view>
    </view>

    <!-- 会员权益 -->
    <view class="section">
      <text class="section-title">会员权益</text>
      <view class="benefits-grid">
        <view class="benefit-card">
          <text class="benefit-icon">🎨</text>
          <text class="benefit-title">海量模板</text>
          <text class="benefit-desc">数百款精选模板免费使用</text>
        </view>
        <view class="benefit-card">
          <text class="benefit-icon">🤖</text>
          <text class="benefit-title">AI 优化</text>
          <text class="benefit-desc">智能矢量/深度处理</text>
        </view>
        <view class="benefit-card">
          <text class="benefit-icon">🎁</text>
          <text class="benefit-title">礼物模式</text>
          <text class="benefit-desc">专属祝福语定制</text>
        </view>
        <view class="benefit-card">
          <text class="benefit-icon">💎</text>
          <text class="benefit-title">积分折扣</text>
          <text class="benefit-desc">高等级畅享特价</text>
        </view>
      </view>
    </view>

    <!-- 积分记录 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">积分明细</text>
        <text class="section-more" @tap="viewAllHistory">全部记录 →</text>
      </view>
      <view class="history-list" v-if="historyList.length > 0">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="history-item"
        >
          <view class="history-left">
            <text class="history-desc">{{ item.description }}</text>
            <text class="history-time">{{ formatTime(item.created_at) }}</text>
          </view>
          <text class="history-amount" :class="item.amount > 0 ? 'plus' : 'minus'">
            {{ item.amount > 0 ? '+' : '' }}{{ item.amount }}
          </text>
        </view>
      </view>
      <view v-else class="empty-mini">
        <text>暂无记录</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="action-section">
      <view class="action-btn" @tap="goStore">
        <text>🏪 门店绑定管理</text>
      </view>
      <view class="action-btn" @tap="goHelp">
        <text>📖 使用帮助</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { api } from '@/api'

const userStore = useUserStore()
const historyList = ref<any[]>([])
const totalSpent = ref(0)
const orderCount = ref(0)

const memberLevel = computed(() => {
  const points = userStore.userInfo?.points_balance || 0
  if (points >= 500) return '钻石会员'
  if (points >= 200) return '黄金会员'
  if (points >= 50) return '白银会员'
  return '普通会员'
})

const levelClass = computed(() => {
  const points = userStore.userInfo?.points_balance || 0
  if (points >= 500) return 'diamond'
  if (points >= 200) return 'gold'
  if (points >= 50) return 'silver'
  return ''
})

function formatTime(t: string | null): string {
  if (!t) return '-'
  try {
    const d = new Date(t)
    return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return t
  }
}

async function fetchHistory() {
  try {
    const res: any = await api.points.history()
    historyList.value = (res.items || res.transactions || res.data || []).slice(0, 5)
    totalSpent.value = res.total_spent || 0
    orderCount.value = res.order_count || 0
  } catch {
    historyList.value = []
  }
}

function viewAllHistory() {
  // 积分明细页 — 切换到订单页查看完整记录
  uni.navigateTo({ url: '/pages/orders/index' })
}

function goStore() {
  uni.navigateTo({ url: '/pages/store/index' })
}

function goHelp() {
  uni.navigateTo({ url: '/pages/help/index' })
}

onShow(() => {
  if (userStore.isLogin) {
    userStore.fetchUserInfo()
    fetchHistory()
  }
})
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '加入31度激光雕刻会员 · 畅享AI图像处理与积分折扣',
      path: '/pages/membership/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻会员中心 · 积分兑换、AI处理、专属模板',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-membership {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
  padding-bottom: 80rpx;
}

/* Member Card */
.member-card {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: $radius-lg;
  padding: 32rpx;
  margin-bottom: 24rpx;
  color: #fff;
}

.member-top {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;

  &.placeholder { border: 3rpx solid rgba(255,255,255,0.2); }
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.member-name {
  font-size: 32rpx;
  font-weight: 700;
}

.level-badge {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.8);

  &.silver { background: rgba(192,192,192,0.2); }
  &.gold { background: rgba(255,215,0,0.2); color: #ffd700; }
  &.diamond { background: rgba(147,112,219,0.2); color: #9370db; }
}

.points-row {
  display: flex;
  align-items: center;
}

.points-item {
  flex: 1;
  text-align: center;
}

.points-value {
  font-size: 40rpx;
  font-weight: 800;
  display: block;
}

.points-label {
  font-size: 22rpx;
  opacity: 0.7;
  margin-top: 4rpx;
  display: block;
}

.points-divider {
  width: 2rpx;
  height: 48rpx;
  background: rgba(255,255,255,0.15);
}

/* Section */
.section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: 16rpx;

  .section-header & { margin-bottom: 0; }
}

.section-more {
  font-size: 22rpx;
  color: $primary;
}

/* Benefits */
.benefits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.benefit-card {
  text-align: center;
  padding: 24rpx 12rpx;
  background: $bg-card-hover;
  border-radius: $radius-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.benefit-icon { font-size: 40rpx; }

.benefit-title {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-primary;
}

.benefit-desc {
  font-size: 20rpx;
  color: $text-secondary;
}

/* History */
.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $border-subtle;

  &:last-child { border-bottom: none; }
}

.history-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.history-desc {
  font-size: 26rpx;
  color: $text-primary;
}

.history-time {
  font-size: 20rpx;
  color: $text-muted;
}

.history-amount {
  font-size: 28rpx;
  font-weight: 700;

  &.plus { color: $success; }
  &.minus { color: $danger; }
}

.empty-mini {
  text-align: center;
  padding: 40rpx 0;
  color: $text-muted;
  font-size: 24rpx;
}

/* Actions */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.action-btn {
  padding: 24rpx;
  background: $bg-card;
  border-radius: $radius-md;
  text-align: center;

  &:active { background: $bg-card-hover; }

  text {
    font-size: 28rpx;
    color: $text-primary;
  }
}
</style>
