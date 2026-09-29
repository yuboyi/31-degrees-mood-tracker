import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAgentHandoffStore } from '@/stores/agentHandoff'
import { decodeQuery } from '@/utils/agentHandoff'

// 全局页面混入：在 mp-weixin 下，页面 onLoad 时自动把微信AI「页面接力(handoff)」
// 数据（由 App.vue 中的 wx.onAgentHandoff 缓存到 globalData.agentHandoffs）注入
// agentHandoff store，页面即可在 onLoad/onShow 中读取 payload 同步流程状态。
const agentHandoffMixin = {
  onLoad() {
    // #ifdef MP-WEIXIN
    try {
      const appInst = getApp({ allowDefault: true })
      const map = (appInst && appInst.globalData && appInst.globalData.agentHandoffs) || {}
      const keys = Object.keys(map)
      if (!keys.length) return

      // 微信在接力打开的页面上提供 getPageId()，优先按 pageId 精确匹配
      const scope = this.$scope || this
      const pageId = typeof scope.getPageId === 'function' ? scope.getPageId() : ''
      let hitKey = pageId && map[pageId] ? pageId : ''
      let hit = hitKey ? map[hitKey] : null

      if (!hit) {
        // 兜底：按页面路径匹配（兼容无 getPageId 的场景）
        const rawRoute = String(scope.route || this.__route__ || '').replace(/^\//, '')
        for (const k of keys) {
          const h = map[k]
          if (h && h.path) {
            const p = String(h.path).replace(/^\//, '')
            if (p === rawRoute) {
              hit = h
              hitKey = k
              break
            }
          }
        }
      }

      if (hit) {
        const store = useAgentHandoffStore()
        const query = typeof hit.query === 'string' ? decodeQuery(hit.query) : (hit.query || {})
        store.setHandoff({ path: hit.path, query, payload: hit.payload || null })
        if (hitKey) delete map[hitKey]
      }
    } catch (e) {
      // 忽略异常，避免影响页面正常加载
    }
    // #endif
  },
}

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.mixin(agentHandoffMixin)
  return { app, pinia }
}
