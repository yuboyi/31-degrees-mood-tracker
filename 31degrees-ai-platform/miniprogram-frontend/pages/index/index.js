// pages/index/index.js
const app = getApp()
const api = require('../../utils/api.js')
const auth = require('../../utils/auth.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: null,
    isLogin: false,
    
    // 用户统计数据
    remainingRequests: 0,
    userStats: {
      totalWorks: 0,
      totalRequests: 0,
      todayRequests: 0
    },
    
    // 最近作品
    recentWorks: [],
    
    // 加载状态
    loading: false,
    
    // 页面状态
    pageReady: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('首页加载', options)
    
    // 初始化页面数据
    this.initPageData()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('首页渲染完成')
    this.setData({
      pageReady: true
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('首页显示')
    
    // 每次显示页面时刷新数据
    this.refreshPageData()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('首页隐藏')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('首页卸载')
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('下拉刷新')
    
    this.refreshPageData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '31度文创精灵 - AI赋能无限创意',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline: function () {
    return {
      title: '31度文创精灵 - AI赋能无限创意',
      query: '',
      imageUrl: '/images/share-cover.png'
    }
  },

  /**
   * 初始化页面数据
   */
  initPageData() {
    // 获取用户登录状态
    const loginInfo = app.getLoginInfo()
    if (loginInfo.isLogin) {
      this.setData({
        userInfo: loginInfo.userInfo,
        isLogin: true
      })
      
      // 加载用户相关数据
      this.loadUserData()
    } else {
      this.setData({
        isLogin: false,
        userInfo: null
      })
    }
    
    // 加载默认数据
    this.loadDefaultData()
  },

  /**
   * 刷新页面数据
   */
  refreshPageData() {
    return new Promise((resolve) => {
      // 检查登录状态变化
      const loginInfo = app.getLoginInfo()
      const currentLoginStatus = this.data.isLogin
      
      if (loginInfo.isLogin !== currentLoginStatus) {
        // 登录状态发生变化，重新初始化
        this.initPageData()
        resolve()
        return
      }
      
      if (loginInfo.isLogin) {
        // 已登录，刷新用户数据
        Promise.all([
          this.loadUserStats(),
          this.loadRecentWorks()
        ]).then(() => {
          resolve()
        }).catch(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  },

  /**
   * 加载默认数据
   */
  loadDefaultData() {
    // 可以加载一些公共数据，如推荐作品、公告等
    console.log('加载默认数据')
  },

  /**
   * 加载用户数据
   */
  loadUserData() {
    if (!this.data.isLogin) return
    
    Promise.all([
      this.loadUserStats(),
      this.loadRecentWorks()
    ]).catch(err => {
      console.error('加载用户数据失败:', err)
    })
  },

  /**
   * 加载用户统计数据
   */
  loadUserStats() {
    return new Promise((resolve, reject) => {
      api.get('/ai/stats', {}, {
        success: (res) => {
          if (res.data) {
            this.setData({
              remainingRequests: res.data.remainingRequests || 0,
              'userStats.totalWorks': res.data.completedTasks || 0,
              'userStats.totalRequests': res.data.totalTasks || 0,
              'userStats.todayRequests': res.data.todayRequests || 0
            })
          }
          resolve(res)
        },
        fail: (err) => {
          console.error('获取用户统计失败:', err)
          reject(err)
        },
        showLoading: false
      })
    })
  },

  /**
   * 加载最近作品
   */
  loadRecentWorks() {
    return new Promise((resolve, reject) => {
      api.get('/ai/tasks', {
        status: 'completed',
        page: 1,
        size: 6
      }, {
        success: (res) => {
          if (res.data && Array.isArray(res.data)) {
            // 格式化作品数据
            const works = res.data.map(task => ({
              id: task.id,
              imageUrl: task.resultImageUrl,
              prompt: task.prompt,
              createTime: this.formatTime(task.createdTime),
              taskType: task.taskType
            }))
            
            this.setData({
              recentWorks: works
            })
          }
          resolve(res)
        },
        fail: (err) => {
          console.error('获取最近作品失败:', err)
          reject(err)
        },
        showLoading: false
      })
    })
  },

  /**
   * 处理登录
   */
  handleLogin() {
    console.log('开始登录')
    
    this.setData({ loading: true })
    
    auth.login().then((userInfo) => {
      console.log('登录成功:', userInfo)
      
      this.setData({
        userInfo: userInfo,
        isLogin: true,
        loading: false
      })
      
      // 登录成功后加载用户数据
      this.loadUserData()
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    }).catch((err) => {
      console.error('登录失败:', err)
      
      this.setData({ loading: false })
      
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
    })
  },

  /**
   * 导航到文生图页面
   */
  navigateToTextToImage() {
    if (!this.checkLoginAndNavigate()) return
    
    wx.navigateTo({
      url: '/pages/create/text-to-image/index'
    })
  },

  /**
   * 导航到图生图页面
   */
  navigateToImageToImage() {
    if (!this.checkLoginAndNavigate()) return
    
    wx.navigateTo({
      url: '/pages/create/image-to-image/index'
    })
  },

  /**
   * 导航到图转2.5D页面
   */
  navigateToImageTo25D() {
    if (!this.checkLoginAndNavigate()) return
    
    wx.navigateTo({
      url: '/pages/create/image-to-25d/index'
    })
  },

  /**
   * 导航到图转3D页面
   */
  navigateToImageTo3D() {
    if (!this.checkLoginAndNavigate()) return
    
    // 检查VIP权限
    if (!this.checkVipPermission()) {
      wx.showModal({
        title: '升级提示',
        content: '图转3D功能需要VIP权限，是否立即升级？',
        confirmText: '立即升级',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/profile/vip/index'
            })
          }
        }
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/create/image-to-3d/index'
    })
  },

  /**
   * 导航到作品画廊
   */
  navigateToGallery() {
    wx.switchTab({
      url: '/pages/gallery/index'
    })
  },

  /**
   * 导航到创作页面
   */
  navigateToCreate() {
    wx.switchTab({
      url: '/pages/create/index'
    })
  },

  /**
   * 预览作品
   */
  previewWork(e) {
    const index = e.currentTarget.dataset.index
    const work = this.data.recentWorks[index]
    
    if (!work || !work.imageUrl) {
      wx.showToast({
        title: '图片加载失败',
        icon: 'none'
      })
      return
    }
    
    // 构造预览图片数组
    const imageUrls = this.data.recentWorks
      .filter(w => w.imageUrl)
      .map(w => w.imageUrl)
    
    wx.previewImage({
      current: work.imageUrl,
      urls: imageUrls
    })
  },

  /**
   * 检查登录状态并导航
   */
  checkLoginAndNavigate() {
    if (!this.data.isLogin) {
      wx.showModal({
        title: '登录提示',
        content: '请先登录后再使用该功能',
        confirmText: '立即登录',
        success: (res) => {
          if (res.confirm) {
            this.handleLogin()
          }
        }
      })
      return false
    }
    
    // 检查今日使用次数
    if (this.data.remainingRequests <= 0) {
      wx.showModal({
        title: '使用次数不足',
        content: '今日使用次数已用完，请明日再试或升级VIP',
        showCancel: false
      })
      return false
    }
    
    return true
  },

  /**
   * 检查VIP权限
   */
  checkVipPermission() {
    const userInfo = this.data.userInfo
    return userInfo && (userInfo.vipLevel === 'VIP' || userInfo.vipLevel === 'PREMIUM')
  },

  /**
   * 格式化时间
   */
  formatTime(dateStr) {
    if (!dateStr) return ''
    
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) { // 24小时内
      return Math.floor(diff / 3600000) + '小时前'
    } else if (diff < 2592000000) { // 30天内
      return Math.floor(diff / 86400000) + '天前'
    } else {
      return date.toLocaleDateString()
    }
  }
})