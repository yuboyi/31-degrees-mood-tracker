<template>
  <view class="page-my">
    <!-- 用户信息区 -->
    <view class="user-card">
      <image :src="userInfo?.avatar || '/static/images/avatar-default.png'" class="user-avatar" mode="aspectFill" />
      <view class="user-detail">
        <text class="user-name">{{ userInfo?.nickname || '未登录' }}</text>
        <text class="user-id">{{ phoneText }}</text>
      </view>
      <view class="user-points">
        <text class="points-value">{{ userInfo?.points_balance ?? 0 }}</text>
        <text class="points-label">积分余额</text>
      </view>
    </view>

    <view class="login-card">
      <view class="login-copy">
        <text class="login-title">{{ loginTitle }}</text>
        <text class="login-desc">{{ loginDesc }}</text>
      </view>
      <button
        v-if="!isLogin"
        class="primary-action"
        :loading="loginBusy"
        :disabled="loginBusy"
        @tap="quickLogin"
      >
        {{ loginBusy ? '登录中' : '微信快捷登录' }}
      </button>
      <button
        v-else-if="!userInfo?.phone"
        class="primary-action"
        open-type="getPhoneNumber"
        :loading="phoneBusy"
        :disabled="phoneBusy"
        @getphonenumber="handlePhoneNumber"
      >
        {{ phoneBusy ? '绑定中' : '手机号快捷绑定' }}
      </button>
      <button v-else class="secondary-action" @tap="copyMiniProgramPath">复制小程序路径</button>
    </view>

    <!-- 积分记录 -->
    <view class="section">
      <text class="section-title">积分明细</text>
      <view v-if="transactions.length > 0" class="tx-list">
        <view v-for="tx in transactions" :key="tx.id" class="tx-item">
          <view class="tx-left">
            <text class="tx-type">{{ tx.type_label }}</text>
            <text class="tx-time">{{ tx.created_at?.slice(0, 16) }}</text>
          </view>
          <text class="tx-amount" :class="{ plus: tx.amount > 0, minus: tx.amount < 0 }">
            {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }} 积分
          </text>
        </view>
      </view>
      <view v-else class="empty-small">
        <text class="empty-text">暂无记录</text>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">我的作品</text>
        <text class="section-action" @tap="goWorks">全部</text>
      </view>
      <view v-if="mockWorks.length > 0" class="work-list">
        <view v-for="work in mockWorks.slice(0, 3)" :key="work.id" class="work-item" @tap="goWorkDetail(work)">
          <view class="work-thumb">
            <text>{{ work.type === 'text25d' ? '文' : '图' }}</text>
          </view>
          <view class="work-copy">
            <text class="work-title">{{ work.title }}</text>
            <text class="work-meta">{{ work.style }} · {{ work.status }}</text>
          </view>
          <text class="menu-arrow">→</text>
        </view>
      </view>
      <view v-else class="empty-small">
        <text class="empty-text">暂无作品，先去生成一张 2.5D 预览</text>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">打样记录</text>
        <text class="section-action" @tap="goSampleSubmit">新增</text>
      </view>
      <view v-if="sampleOrders.length > 0" class="work-list">
        <view v-for="order in sampleOrders.slice(0, 3)" :key="order.id" class="work-item">
          <view class="work-thumb sample">
            <text>样</text>
          </view>
          <view class="work-copy">
            <text class="work-title">{{ order.title }}</text>
            <text class="work-meta">{{ order.material }} · {{ order.size }} · {{ order.status }}</text>
          </view>
          <text class="menu-arrow">→</text>
        </view>
      </view>
      <view v-else class="empty-small">
        <text class="empty-text">暂无打样记录，生成2.5D后可提交给打样人员确认</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="section">
      <text class="section-title">功能</text>
      <view class="menu-list">
        <view class="menu-item" @tap="goText25d">
          <text class="menu-label">文生2.5D</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goImage25d">
          <text class="menu-label">图转2.5D</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goWorks">
          <text class="menu-label">作品历史</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goOrders">
          <text class="menu-label">我的订单</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goSampleSubmit">
          <text class="menu-label">提交打样 / 打样记录</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goDevices">
          <text class="menu-label">我的设备 / 绑定设备</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goAIStudio">
          <text class="menu-label">智能处理中心</text>
          <text class="menu-arrow">→</text>
        </view>
        <button class="menu-item share-menu" open-type="contact" @tap="contactFallback">
          <text class="menu-label">联系客服</text>
          <text class="menu-arrow">→</text>
        </button>
        <view class="menu-item" @tap="copyWebsite">
          <text class="menu-label">企业官网</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goOfficialConsumables">
          <text class="menu-label">官方商城入口</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goHelp">
          <text class="menu-label">使用帮助</text>
          <text class="menu-arrow">→</text>
        </view>
        <view v-if="showDevPreview" class="menu-item" @tap="goDevPreview">
          <text class="menu-label">开发进行中预览</text>
          <text class="menu-arrow">→</text>
        </view>
        <button class="menu-item share-menu" open-type="share">
          <text class="menu-label">分享给微信好友</text>
          <text class="menu-arrow">→</text>
        </button>
        <view class="menu-item" @tap="copyMiniProgramPath">
          <text class="menu-label">复制小程序路径</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @tap="goAbout">
          <text class="menu-label">关于我们</text>
          <text class="menu-arrow">→</text>
        </view>
        <view v-if="isLogin" class="menu-item logout-item" @tap="logout">
          <text class="menu-label">退出登录</text>
          <text class="menu-arrow">→</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { api } from '@/api'
import { MINI_PROGRAM_ENTRY, WEIDIAN_STORE } from '@/config/ecosystem'

const APP_VERSION = '0.1.3'
const OFFICIAL_CONSUMABLES_APP_ID = WEIDIAN_STORE.appId
const OFFICIAL_CONSUMABLES_PATH = WEIDIAN_STORE.homePath
const OFFICIAL_CONSUMABLES_WECHAT_LINK = WEIDIAN_STORE.fallbackLink

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isLogin = computed(() => userStore.isLogin)
const showDevPreview = import.meta.env.DEV
const loginBusy = ref(false)
const phoneBusy = ref(false)
const mockWorks = ref<any[]>([])
const sampleOrders = ref<any[]>([])
const phoneText = computed(() => {
  const phone = userInfo.value?.phone
  if (!phone) return userInfo.value?.id ? `ID: ${userInfo.value.id}` : '未绑定手机号'
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
})
const loginTitle = computed(() => {
  if (!isLogin.value) return '一键进入账号'
  if (!userInfo.value?.phone) return '绑定手机号'
  return '账号已就绪'
})
const loginDesc = computed(() => {
  if (!isLogin.value) return '使用微信身份快速进入，不需要手动输账号密码。'
  if (!userInfo.value?.phone) return '用于找回账号和售后联系，只需授权一次。'
  return '可正常使用积分、订单、素材和设备相关功能。'
})
const transactions = ref<any[]>([])

onShow(async () => {
  uni.showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  } as any)
  await userStore.fetchUserInfo()
  mockWorks.value = uni.getStorageSync('mock_25d_works') || []
  sampleOrders.value = uni.getStorageSync('mock_sample_orders') || []
  try {
    const res = await api.points.history()
    transactions.value = (res as any)?.transactions || (res as any)?.items || (res as any)?.data || []
  } catch (e) {
    // 暂无数据
  }
})

async function quickLogin() {
  if (loginBusy.value) return
  loginBusy.value = true
  try {
    uni.showLoading({ title: '登录中...' })
    const loginRes: any = await uni.login()
    if (!loginRes.code) throw new Error('未获取到登录凭证')
    await userStore.wxLogin(loginRes.code)
    await userStore.fetchUserInfo()
    uni.hideLoading()
    if (!userInfo.value?.phone) {
      uni.showModal({
        title: '登录成功',
        content: '请继续点击“手机号快捷绑定”，完成账号联系信息绑定。',
        showCancel: false,
        confirmText: '知道了',
      })
    } else {
      uni.showToast({ title: '已登录', icon: 'success' })
    }
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '登录失败', icon: 'none' })
  } finally {
    loginBusy.value = false
  }
}

async function handlePhoneNumber(e: any) {
  if (phoneBusy.value) return
  const code = e?.detail?.code
  if (!code) {
    uni.showToast({ title: '未授权手机号', icon: 'none' })
    return
  }
  phoneBusy.value = true
  try {
    uni.showLoading({ title: '绑定中...' })
    await userStore.bindPhone(code)
    uni.hideLoading()
    uni.showToast({ title: '手机号已绑定', icon: 'success' })
  } catch (err: any) {
    uni.hideLoading()
    uni.showToast({ title: err?.message || '绑定失败', icon: 'none' })
  } finally {
    phoneBusy.value = false
  }
}

function goText25d() {
  uni.navigateTo({ url: '/pages/text25d/index' })
}

function goImage25d() {
  uni.navigateTo({ url: '/pages/image25d/index' })
}

function goWorks() {
  uni.navigateTo({ url: '/pages/works/index' })
}

function goWorkDetail(work: any) {
  uni.navigateTo({ url: `/pages/works/detail?id=${work.id}` })
}

function goSampleSubmit() {
  const latest = mockWorks.value?.[0]
  const query = latest?.id ? `?workId=${latest.id}` : ''
  uni.navigateTo({ url: `/pages/sample/submit${query}` })
}

function goOrders() {
  uni.navigateTo({ url: '/pages/orders/index' })
}

function goDevices() {
  uni.navigateTo({ url: '/pages/machine/index' })
}

function goAIStudio() {
  // 智能处理中心：跳转到机器页面，展示 AI 矢量雕刻/深度浮雕/智能抠图/全能优化功能
  uni.navigateTo({ url: '/pages/machine/index' })
}

function goHelp() {
  uni.navigateTo({ url: '/pages/help/index' })
}

function goDevPreview() {
  uni.navigateTo({ url: '/pages/dev-preview/index' })
}

function contactFallback() {
  uni.showToast({ title: '真机微信可联系客服', icon: 'none' })
}

function copyWebsite() {
  uni.setClipboardData({
    data: 'https://ai.31du.com/',
    success() {
      uni.showToast({ title: '官网已复制', icon: 'success' })
    },
  })
}

function goOfficialConsumables() {
  // #ifdef MP-WEIXIN
  uni.navigateToMiniProgram({
    appId: OFFICIAL_CONSUMABLES_APP_ID,
    path: OFFICIAL_CONSUMABLES_PATH,
    envVersion: 'release',
    fail: copyOfficialConsumablesLink,
  })
  // #endif
  // #ifndef MP-WEIXIN
  copyOfficialConsumablesLink()
  // #endif
}

function copyOfficialConsumablesLink() {
  uni.setClipboardData({
    data: OFFICIAL_CONSUMABLES_WECHAT_LINK,
    success() {
      uni.showToast({ title: '商城入口已复制', icon: 'success' })
    },
  })
}

function goAbout() {
  uni.showModal({
    title: '31度',
    content: `版本 ${APP_VERSION}\n31度AI小程序 · 光学激光、彩印喷墨、官方耗材和定制服务\n照片转灰度深度图 / 点阵打标 / UV打印衔接 / 购物商城\nwww.31du.com`,
    showCancel: false
  })
}

function copyMiniProgramPath() {
  uni.setClipboardData({
    data: MINI_PROGRAM_ENTRY.shareLink,
    success() {
      uni.showToast({ title: '入口已复制', icon: 'success' })
    },
  })
}

function logout() {
  userStore.logout()
  transactions.value = []
  uni.showToast({ title: '已退出', icon: 'none' })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度AI定制 · 光学激光/彩印喷墨/官方耗材',
      path: '/pages/index/index?from=my_share',
    }
  },
  onShareTimeline() {
    return {
      title: '31度AI定制 · 光学激光/彩印喷墨/官方耗材',
      query: 'from=my_timeline',
    }
  },
  onCopyUrl() {
    return {
      query: 'from=my_copy',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-my {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: linear-gradient(135deg, rgba($primary, 0.15), rgba(239,68,68,0.08));
  border-radius: $radius-lg;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 3rpx solid $primary;
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 700;
}

.user-id {
  font-size: 22rpx;
  color: $text-secondary;
}

.user-points {
  text-align: center;
  padding: 12rpx 20rpx;
  background: $bg-card-hover;
  border-radius: $radius-md;
}

.points-value {
  font-size: 36rpx;
  font-weight: 800;
  color: $accent;
  display: block;
}

.points-label {
  font-size: 20rpx;
  color: $text-secondary;
}

.section {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.login-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  background: $bg-card;
  border: 1rpx solid $border-default;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.login-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.login-title {
  font-size: 30rpx;
  font-weight: 800;
}

.login-desc {
  font-size: 22rpx;
  line-height: 32rpx;
  color: $text-secondary;
}

.primary-action,
.secondary-action {
  width: 220rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.primary-action {
  background: $primary;
  color: #fff;
}

.secondary-action {
  background: $bg-card-hover;
  color: $text-primary;
  border: 1rpx solid $border-default;
}

.primary-action::after,
.secondary-action::after,
.share-menu::after {
  border: none;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  display: block;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.section-head .section-title {
  margin-bottom: 0;
}

.section-action {
  color: $primary;
  font-size: 24rpx;
  font-weight: 700;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid $border-subtle;
}

.tx-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.tx-type {
  font-size: 26rpx;
}

.tx-time {
  font-size: 20rpx;
  color: $text-muted;
}

.tx-amount {
  font-size: 28rpx;
  font-weight: 600;

  &.plus { color: $success; }
  &.minus { color: $danger; }
}

.work-list {
  display: flex;
  flex-direction: column;
}

.work-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $border-subtle;

  &:last-child { border-bottom: none; }
}

.work-thumb {
  width: 72rpx;
  height: 72rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($primary, 0.18);
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
}

.work-thumb.sample {
  background: rgba(48, 209, 123, 0.18);
}

.work-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.work-title {
  font-size: 26rpx;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-meta {
  font-size: 22rpx;
  color: $text-secondary;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid $border-subtle;

  &:last-child { border-bottom: none; }
}

.share-menu {
  width: 100%;
  height: auto;
  line-height: normal;
  margin: 0;
  background: transparent;
  color: $text-primary;
  border-radius: 0;
  font-size: inherit;
  text-align: left;
}

.logout-item {
  color: $danger;
}

.menu-label {
  font-size: 26rpx;
}

.menu-arrow {
  font-size: 26rpx;
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
