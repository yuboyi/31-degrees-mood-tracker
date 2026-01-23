// pages/profile/index.js
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
    
    // VIP相关
    vipLevelText: '普通用户',
    vipExpireText: '',
    
    // 用户统计
    userStats: {
      totalWorks: 0,
      totalRequests: 0,
      todayRequests: 0,
      dailyLimit: 10
    },
    
    // 处理中的任务数
    processingTasks: 0,
    
    // 加载状态
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('个人中心页面加载', options)
    this.initPageData()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('个人中心页面渲染完成')
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('个人中心页面显示')
    this.refreshPageData()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('个人中心页面隐藏')
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
      title: '31度文创精灵 - 一起来体验AI创作的魅力',
      path: '/pages/index/index?from=share',
      imageUrl: '/images/share-invite.png'
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline: function () {
    return {
      title: '31度文创精灵 - AI赋能无限创意',
      query: 'from=timeline',
      imageUrl: '/images/share-timeline.png'
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
      
      // 处理VIP信息
      this.updateVipInfo()
      
      // 加载用户数据
      this.loadUserData()
    } else {
      this.setData({
        isLogin: false,
        userInfo: null
      })
    }
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
        this.updateVipInfo()
        Promise.all([
          this.loadUserStats(),
          this.loadProcessingTasks()
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
   * 更新VIP信息显示
   */
  updateVipInfo() {
    const userInfo = this.data.userInfo
    if (!userInfo) return
    
    let vipLevelText = '普通用户'
    let vipExpireText = ''
    
    switch (userInfo.vipLevel) {
      case 'VIP':
        vipLevelText = 'VIP会员'
        break
      case 'PREMIUM':
        vipLevelText = '尊享会员'
        break
      default:
        vipLevelText = '普通用户'
        break
    }
    
    if (userInfo.vipExpireTime) {
      const expireDate = new Date(userInfo.vipExpireTime)
      vipExpireText = expireDate.toLocaleDateString()
    }
    
    this.setData({
      vipLevelText,
      vipExpireText
    })
  },

  /**
   * 加载用户数据
   */
  loadUserData() {
    if (!this.data.isLogin) return
    
    Promise.all([
      this.loadUserStats(),
      this.loadProcessingTasks()
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
              'userStats.totalWorks': res.data.completedTasks || 0,
              'userStats.totalRequests': res.data.totalTasks || 0,
              'userStats.todayRequests': res.data.todayRequests || 0,
              'userStats.dailyLimit': res.data.dailyLimit || 10
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
   * 加载处理中的任务数量
   */
  loadProcessingTasks() {
    return new Promise((resolve, reject) => {
      api.get('/ai/tasks', {
        status: 'processing',
        page: 1,
        size: 100
      }, {
        success: (res) => {
          if (res.data && Array.isArray(res.data)) {
            this.setData({
              processingTasks: res.data.length
            })
          }
          resolve(res)
        },
        fail: (err) => {
          console.error('获取处理中任务失败:', err)
          reject(err)
        },
        showLoading: false
      })
    })
  },

  /**
   * 修改头像
   */
  changeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        console.log('选择头像:', res)
        
        // 这里可以上传头像到服务器
        wx.showToast({
          title: '头像上传功能开发中',
          icon: 'none'
        })
      },
      fail: (err) => {
        console.error('选择头像失败:', err)
      }
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
      
      // 登录成功后初始化数据
      this.updateVipInfo()
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
   * 处理退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.performLogout()
        }
      }
    })
  },

  /**
   * 执行退出登录
   */
  performLogout() {
    // 清除本地登录信息
    app.clearLoginInfo()
    
    // 更新页面状态
    this.setData({
      userInfo: null,
      isLogin: false,
      userStats: {
        totalWorks: 0,
        totalRequests: 0,
        todayRequests: 0,
        dailyLimit: 10
      },
      processingTasks: 0
    })
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  },

  /**
   * 导航到VIP页面
   */
  navigateToVip() {
    wx.navigateTo({
      url: '/pages/profile/vip/index'
    })
  },

  /**
   * 导航到作品画廊
   */
  navigateToGallery() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.switchTab({
      url: '/pages/gallery/index'
    })
  },

  /**
   * 导航到任务列表
   */
  navigateToTasks() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/task/list/index'
    })
  },

  /**
   * 导航到下载记录
   */
  navigateToDownloads() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/profile/downloads/index'
    })
  },

  /**
   * 导航到设置
   */
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/profile/settings/index'
    })
  },

  /**
   * 导航到帮助
   */
  navigateToHelp() {
    wx.navigateTo({
      url: '/pages/profile/help/index'
    })
  },

  /**
   * 导航到关于我们
   */
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/profile/about/index'
    })
  }
})