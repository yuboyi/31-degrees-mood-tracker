<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'

onLaunch(async () => {
  const userStore = useUserStore()
  userStore.restoreLogin()
  if (userStore.isLogin) userStore.fetchUserInfo()

  // #ifdef MP-WEIXIN
  // 微信AI「页面接力(handoff)」：原子接口返回 handoff 后，用户点击对话中的
  // 「账号卡片」会打开小程序指定页面，微信通过 wx.onAgentHandoff 回调投递
  // { pageId, path, query, payload }。这里先缓存到 globalData，页面 onLoad 时再取用。
  if (wx.onAgentHandoff) {
    wx.onAgentHandoff((res) => {
      // 回调参数可能是对象也可能是数组，做兼容（数组取最后一项）
      const handoff = Array.isArray(res) ? res[res.length - 1] : res
      if (!handoff) return
      const { pageId, path, query, payload } = handoff
      const app = getApp({ allowDefault: true })
      app.globalData = app.globalData || {}
      app.globalData.agentHandoffs = app.globalData.agentHandoffs || {}
      app.globalData.agentHandoffs[pageId] = { path, query, payload }
    })
  }
  // #endif
})
</script>

<style lang="scss">
page {
  background-color: #f6f7fb;
  color: #1a1a2e;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
}
</style>
