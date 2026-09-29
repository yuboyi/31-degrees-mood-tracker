<template>
  <view class="home-page">
    <view class="home-content">
      <view class="brand" aria-label="31度"><text class="brand-number">31°</text><text class="brand-unit">度</text></view>
      <view class="entry-grid">
        <button class="entry-card" @tap="openRegion('uv')">
          <text class="entry-icon">🖨️</text><text class="entry-title">彩印喷墨</text><text class="entry-subtitle">定制区</text>
        </button>
        <button class="entry-card" @tap="openRegion('laser')">
          <text class="entry-icon">⚡</text><text class="entry-title">光学激光</text><text class="entry-subtitle">定制区</text>
        </button>
        <button class="entry-card locked-card" disabled aria-disabled="true" aria-label="展品签到方案，暂未开放">
          <text class="lock-badge">🔒</text><text class="entry-icon">🏷️</text><text class="entry-title">展品签到方案</text><text class="entry-subtitle">暂未开放</text>
        </button>
        <button class="entry-card shop-card" @tap="openShop">
          <text class="entry-icon">🛒</text><text class="entry-title">官方耗材</text><text class="entry-subtitle">购物商城</text>
        </button>
      </view>
      <view class="quick-actions">
        <!-- #ifdef MP-WEIXIN -->
        <button class="action-button" open-type="share">分享给客户</button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <button class="action-button" @tap="showShareHelp">分享给客户</button>
        <!-- #endif -->
        <button class="action-button" @tap="copyMiniProgramLink">复制小程序路径</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { MINI_PROGRAM_ENTRY, WEIDIAN_STORE } from '@/config/ecosystem'
import { regionRoute } from '@/utils/homeRegions.mjs'

function openRegion(region: string) {
  const url = regionRoute(region)
  if (url) uni.navigateTo({ url, fail: () => uni.showToast({ title: '入口打开失败，请重试', icon: 'none' }) })
}
function copyMiniProgramLink() {
  uni.setClipboardData({ data: MINI_PROGRAM_ENTRY.shareLink,
    success: () => uni.showToast({ title: '小程序链接已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败，请使用微信分享', icon: 'none' }),
  })
}
function showShareHelp() {
  uni.showModal({ title: '分享给客户', content: '浏览器不能直接发送微信小程序卡片。可复制小程序链接，粘贴到微信发送。',
    confirmText: '复制链接', success: result => { if (result.confirm) copyMiniProgramLink() },
  })
}
function showShopFallback() {
  uni.showModal({ title: '前往官方耗材商城', content: '请在微信中打开商城。是否复制已配置的商城小程序链接？',
    confirmText: '复制链接', success: result => {
      if (!result.confirm) return
      uni.setClipboardData({ data: WEIDIAN_STORE.fallbackLink,
        success: () => uni.showToast({ title: '商城链接已复制', icon: 'success' }),
        fail: () => uni.showToast({ title: '复制失败，请在微信内重试', icon: 'none' }),
      })
    },
  })
}
function openShop() {
  // #ifdef MP-WEIXIN
  uni.navigateToMiniProgram({ appId: WEIDIAN_STORE.appId, path: WEIDIAN_STORE.homePath,
    envVersion: 'release', fail: showShopFallback })
  // #endif
  // #ifndef MP-WEIXIN
  showShopFallback()
  // #endif
}
onShareAppMessage(() => ({ title: '31度 · 彩印喷墨与光学激光定制', path: MINI_PROGRAM_ENTRY.homePath }))
onShareTimeline(() => ({ title: '31度 · 彩印喷墨与光学激光定制', query: 'from=timeline' }))
</script>

<style scoped lang="scss">
.home-page { min-height: calc(100vh - var(--window-bottom, 0px)); box-sizing: border-box; padding: calc(100rpx + env(safe-area-inset-top)) 40rpx 70rpx; background: linear-gradient(180deg, #902426 0%, #58191b 48%, #1c0707 100%); }
.home-content { max-width: 680px; margin: 0 auto; }
.brand { display: flex; align-items: baseline; justify-content: center; color: #ff092b; padding: 94rpx 0 34rpx; }
.brand-number { font-size: 96rpx; line-height: 1; font-weight: 900; }
.brand-unit { font-size: 34rpx; font-weight: 800; margin-left: 8rpx; }
.entry-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26rpx; }
.entry-card { position: relative; width: 100%; min-width: 0; margin: 0; min-height: 290rpx; padding: 34rpx 10rpx; border-radius: 20rpx; background: #f7f7f7; color: #b41e23; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.35; box-sizing: border-box; }
.entry-card::after, .action-button::after { border: 0; }
.entry-card:active:not([disabled]) { opacity: .9; }
.entry-icon { display: block; font-size: 60rpx; line-height: 1.3; margin-bottom: 18rpx; }
.entry-title { display: block; font-size: 32rpx; font-weight: 800; }
.entry-subtitle { display: block; font-size: 24rpx; font-weight: 600; margin-top: 5rpx; }
.entry-card.locked-card[disabled] { background: #b49d9e; color: #756165; }
.locked-card .entry-icon { opacity: .35; }
.lock-badge { position: absolute; top: 14rpx; right: 14rpx; font-size: 21rpx; background: #8f7779; padding: 6rpx; border-radius: 50%; }
.shop-card { background: #972326; color: #fff; border: 2rpx solid #b15355; }
.quick-actions { display: flex; justify-content: space-around; gap: 24rpx; margin-top: 34rpx; }
.action-button { margin: 0; padding: 14rpx 20rpx; line-height: 1.4; font-size: 25rpx; font-weight: 700; border: 1rpx solid #927373; border-radius: 10rpx; background: #ffffff13; color: #fff; }
@media (min-width: 700px) { .home-page { padding-top: 32px; } .brand { padding: 36px 0; } .entry-card { min-height: 210px; } }
</style>
