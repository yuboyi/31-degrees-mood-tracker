// app.js
const api = require('./utils/api.js')
const auth = require('./utils/auth.js')

App({
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: 'https://api.31degrees.com/api', // TODO: override per environment
    isLogin: false,
    version: '1.0.0',
    systemInfo: null
  },

  onLaunch() {
    console.log('31 Degrees mini program launched')
    this.checkLoginStatus()
    this.getSystemInfo()
  },

  onShow() {
    console.log('Mini program visible')
  },

  onHide() {
    console.log('Mini program hidden')
  },

  onError(message) {
    console.error('Mini program error:', message)
    wx.showToast({
      title: 'An unexpected error occurred',
      icon: 'none'
    })
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.isLogin = true
      this.validateToken()
    }
  },

  validateToken() {
    api.request({
      url: '/auth/validate',
      method: 'POST',
      requireAuth: false,
      success: (res) => {
        if (!res.data) {
          this.clearLoginInfo()
        }
      },
      fail: () => {
        this.clearLoginInfo()
      }
    })
  },

  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        console.log('System info:', res)
      }
    })
  },

  setLoginInfo(token, userInfo) {
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    this.globalData.isLogin = true

    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
  },

  clearLoginInfo() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.isLogin = false

    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },

  ensureLogin(callback) {
    if (this.globalData.isLogin) {
      callback && callback()
      return
    }

    wx.showModal({
      title: 'Sign-in required',
      content: 'Please sign in to continue.',
      confirmText: 'Sign in',
      success: (res) => {
        if (res.confirm) {
          auth.login().then(() => callback && callback())
        }
      }
    })
  }
})