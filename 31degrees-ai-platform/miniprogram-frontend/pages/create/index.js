// pages/create/index.js
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
    remainingRequests: 0,
    
    // 最近任务
    recentTasks: [],
    
    // 弹窗状态
    showLoginModal: false,
    
    // 加载状态
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('创作页面加载', options)
    this.initPageData()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('创作页面渲染完成')
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('创作页面显示')
    this.refreshPageData()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('创作页面隐藏')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('创作页面卸载')
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
      title: '31度文创精灵 - AI创作工作台',
      path: '/pages/create/index',
      imageUrl: '/images/share-create.png'
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
      // 检查登录状态
      const loginInfo = app.getLoginInfo()
      const currentLoginStatus = this.data.isLogin
      
      if (loginInfo.isLogin !== currentLoginStatus) {
        this.initPageData()
        resolve()
        return
      }
      
      if (loginInfo.isLogin) {
        // 刷新用户数据
        Promise.all([
          this.loadUserStats(),
          this.loadRecentTasks()
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
   * 加载用户数据
   */
  loadUserData() {
    if (!this.data.isLogin) return
    
    Promise.all([
      this.loadUserStats(),
      this.loadRecentTasks()
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
              remainingRequests: res.data.remainingRequests || 0
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
   * 加载最近任务
   */
  loadRecentTasks() {
    return new Promise((resolve, reject) => {
      api.get('/ai/tasks', {
        page: 1,
        size: 5
      }, {
        success: (res) => {
          if (res.data && Array.isArray(res.data)) {
            // 格式化任务数据
            const tasks = res.data.map(task => ({
              id: task.id,
              prompt: task.prompt || '无描述',
              resultImageUrl: task.resultImageUrl,
              status: task.status,
              statusText: this.getStatusText(task.status),
              createTime: this.formatTime(task.createdTime),
              taskType: task.taskType
            }))
            
            this.setData({
              recentTasks: tasks
            })
          }
          resolve(res)
        },
        fail: (err) => {
          console.error('获取最近任务失败:', err)
          reject(err)
        },
        showLoading: false
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
   * 查看所有任务
   */
  viewAllTasks() {
    wx.switchTab({
      url: '/pages/gallery/index'
    })
  },

  /**
   * 查看任务详情
   */
  viewTaskDetail(e) {
    const task = e.currentTarget.dataset.task
    
    wx.navigateTo({
      url: `/pages/task/detail/index?taskId=${task.id}`
    })
  },

  /**
   * 显示登录弹窗
   */
  showLoginModal() {
    this.setData({
      showLoginModal: true
    })
  },

  /**
   * 隐藏登录弹窗
   */
  hideLoginModal() {
    this.setData({
      showLoginModal: false
    })
  },

  /**
   * 处理登录
   */
  handleLogin() {
    this.hideLoginModal()
    
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
   * 检查登录状态并导航
   */
  checkLoginAndNavigate() {
    if (!this.data.isLogin) {
      this.showLoginModal()
      return false
    }
    
    // 检查今日使用次数
    if (this.data.remainingRequests <= 0) {
      wx.showModal({
        title: '使用次数不足',
        content: '今日使用次数已用完，请明日再试或升级VIP',
        confirmText: '升级VIP',
        cancelText: '知道了',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/profile/vip/index'
            })
          }
        }
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
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'pending': '等待中',
      'processing': '处理中',
      'completed': '已完成',
      'failed': '已失败'
    }
    return statusMap[status] || '未知状态'
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