import { defineStore } from 'pinia'

/**
 * 微信AI「页面接力(handoff)」状态 store。
 *
 * 微信AI开发模式下，原子接口返回 handoff 后，用户点击对话中的「账号卡片」
 * 会打开小程序指定页面，微信通过 wx.onAgentHandoff 回调把
 * { pageId, path, query, payload } 投递给小程序（见 App.vue 缓存到 globalData）。
 * 全局页面混入（main.js）在页面 onLoad 时把命中的 handoff 注入本 store，
 * 页面在 onLoad/onShow 时读取 payload 同步流程状态。
 */
export const useAgentHandoffStore = defineStore('agentHandoff', {
  state: () => ({
    source: '',      // 数据来源标识，handoff 注入后为 'ai'
    path: '',        // 接力页面的小程序路径
    query: {},       // 接力页面携带的 query 参数（对象）
    payload: null,   // 原子接口返回的流程状态数据（业务 payload）
    receivedAt: 0,   // 注入时间戳（ms）
  }),
  getters: {
    // 是否存在待消费的 handoff
    hasHandoff: (state) => !!state.payload,
  },
  actions: {
    setHandoff(data) {
      this.source = 'ai'
      this.path = data.path || ''
      this.query = data.query || {}
      this.payload = data.payload || null
      this.receivedAt = Date.now()
    },
    // 取出 payload 并清空状态（一次性消费）
    consumeHandoff() {
      const out = this.payload
      this.$reset()
      return out
    },
    clear() {
      this.$reset()
    },
  },
})
