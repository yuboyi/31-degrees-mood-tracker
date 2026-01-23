// pages/gallery/index.js
const app = getApp()
const api = require('../../utils/api.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 作品列表
    artworks: [],
    
    // 搜索和筛选
    searchKeyword: '',
    filterTags: [],
    showFilter: false,
    filterData: {
      type: '',
      style: '',
      timeRange: ''
    },
    
    // 筛选选项
    typeOptions: [
      { key: '', name: '全部' },
      { key: 'text_to_image', name: '文生图' },
      { key: 'image_to_image', name: '图生图' },
      { key: 'image_to_25d', name: '图转2.5D' },
      { key: 'image_to_3d', name: '图转3D' }
    ],
    styleOptions: [
      { key: '', name: '全部' },
      { key: '写实', name: '写实' },
      { key: '动漫', name: '动漫' },
      { key: '国风', name: '国风' },
      { key: '油画', name: '油画' },
      { key: '水彩', name: '水彩' },
      { key: '素描', name: '素描' }
    ],
    timeRangeOptions: [
      { key: '', name: '全部' },
      { key: 'today', name: '今天' },
      { key: 'week', name: '本周' },
      { key: 'month', name: '本月' },
      { key: '3month', name: '三个月' }
    ],
    
    // 分页和加载
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    loadingMore: false,
    
    // 用户状态
    isLogin: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('画廊页面加载', options)
    this.checkLoginStatus()
    this.loadArtworks()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('画廊页面渲染完成')
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('画廊页面显示')
    // 检查登录状态变化
    this.checkLoginStatus()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('画廊页面隐藏')
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('下拉刷新')
    this.refreshArtworks().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('上拉加载更多')
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMoreArtworks()
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '31度文创精灵 - 我的AI作品画廊',
      path: '/pages/gallery/index',
      imageUrl: '/images/share-gallery.png'
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const loginInfo = app.getLoginInfo()
    this.setData({
      isLogin: loginInfo.isLogin
    })
    
    if (!loginInfo.isLogin) {
      // 未登录，显示空状态
      this.setData({
        artworks: [],
        hasMore: false
      })
    }
  },

  /**
   * 加载作品列表
   */
  loadArtworks() {
    if (!this.data.isLogin) {
      console.log('未登录，跳过加载作品')
      return
    }
    
    this.setData({ loading: true })
    
    const params = this.buildRequestParams()
    
    api.get('/ai/tasks', params, {
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          const artworks = this.formatArtworks(res.data)
          
          this.setData({
            artworks: artworks,
            hasMore: res.data.length >= this.data.pageSize,
            loading: false
          })
        } else {
          this.setData({
            artworks: [],
            hasMore: false,
            loading: false
          })
        }
      },
      fail: (err) => {
        console.error('加载作品失败:', err)
        this.setData({ loading: false })
        
        if (!err.message || !err.message.includes('登录')) {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
      },
      showLoading: false
    })
  },

  /**
   * 刷新作品列表
   */
  refreshArtworks() {
    return new Promise((resolve) => {
      this.setData({
        currentPage: 1,
        artworks: [],
        hasMore: true
      })
      
      this.loadArtworks()
      resolve()
    })
  },

  /**
   * 加载更多作品
   */
  loadMoreArtworks() {
    if (!this.data.isLogin || this.data.loadingMore || !this.data.hasMore) {
      return
    }
    
    this.setData({ loadingMore: true })
    
    const nextPage = this.data.currentPage + 1
    const params = this.buildRequestParams(nextPage)
    
    api.get('/ai/tasks', params, {
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          const newArtworks = this.formatArtworks(res.data)
          const allArtworks = [...this.data.artworks, ...newArtworks]
          
          this.setData({
            artworks: allArtworks,
            currentPage: nextPage,
            hasMore: res.data.length >= this.data.pageSize,
            loadingMore: false
          })
        } else {
          this.setData({
            hasMore: false,
            loadingMore: false
          })
        }
      },
      fail: (err) => {
        console.error('加载更多作品失败:', err)
        this.setData({ loadingMore: false })
        
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      },
      showLoading: false
    })
  },

  /**
   * 构建请求参数
   */
  buildRequestParams(page = 1) {
    const params = {
      page: page,
      size: this.data.pageSize,
      status: 'completed' // 只显示已完成的作品
    }
    
    // 添加筛选条件
    if (this.data.filterData.type) {
      params.taskType = this.data.filterData.type
    }
    
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword
    }
    
    return params
  },

  /**
   * 格式化作品数据
   */
  formatArtworks(tasks) {
    return tasks.filter(task => task.resultImageUrl).map(task => ({
      id: task.id,
      imageUrl: task.resultImageUrl,
      prompt: task.prompt || '无描述',
      createTime: this.formatTime(task.createdTime),
      taskType: task.taskType,
      typeText: this.getTypeText(task.taskType),
      style: task.style || ''
    }))
  },

  /**
   * 获取类型文本
   */
  getTypeText(taskType) {
    const typeMap = {
      'text_to_image': '文生图',
      'image_to_image': '图生图',
      'image_to_25d': '2.5D',
      'image_to_3d': '3D'
    }
    return typeMap[taskType] || '未知'
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword
    })
    
    // 防抖搜索
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
    
    this.searchTimer = setTimeout(() => {
      this.refreshArtworks()
    }, 500)
  },

  /**
   * 搜索确认
   */
  onSearchConfirm(e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword
    })
    this.refreshArtworks()
  },

  /**
   * 显示筛选弹窗
   */
  showFilterModal() {
    this.setData({
      showFilter: true
    })
  },

  /**
   * 隐藏筛选弹窗
   */
  hideFilterModal() {
    this.setData({
      showFilter: false
    })
  },

  /**
   * 选择筛选类型
   */
  selectFilterType(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      'filterData.type': key
    })
  },

  /**
   * 选择筛选风格
   */
  selectFilterStyle(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      'filterData.style': key
    })
  },

  /**
   * 选择时间范围
   */
  selectFilterTimeRange(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      'filterData.timeRange': key
    })
  },

  /**
   * 重置筛选
   */
  resetFilter() {
    this.setData({
      filterData: {
        type: '',
        style: '',
        timeRange: ''
      },
      filterTags: []
    })
  },

  /**
   * 应用筛选
   */
  applyFilter() {
    // 生成筛选标签
    const tags = []
    const { type, style, timeRange } = this.data.filterData
    
    if (type) {
      const typeOption = this.data.typeOptions.find(opt => opt.key === type)
      if (typeOption) {
        tags.push({ key: `type_${type}`, name: typeOption.name, active: true })
      }
    }
    
    if (style) {
      tags.push({ key: `style_${style}`, name: style, active: true })
    }
    
    if (timeRange) {
      const timeOption = this.data.timeRangeOptions.find(opt => opt.key === timeRange)
      if (timeOption) {
        tags.push({ key: `time_${timeRange}`, name: timeOption.name, active: true })
      }
    }
    
    this.setData({
      filterTags: tags,
      showFilter: false
    })
    
    // 刷新作品列表
    this.refreshArtworks()
  },

  /**
   * 切换筛选标签
   */
  toggleFilter(e) {
    const key = e.currentTarget.dataset.key
    
    // 移除对应的筛选条件
    if (key.startsWith('type_')) {
      this.setData({ 'filterData.type': '' })
    } else if (key.startsWith('style_')) {
      this.setData({ 'filterData.style': '' })
    } else if (key.startsWith('time_')) {
      this.setData({ 'filterData.timeRange': '' })
    }
    
    // 更新标签列表
    const filterTags = this.data.filterTags.filter(tag => tag.key !== key)
    this.setData({ filterTags })
    
    // 刷新作品列表
    this.refreshArtworks()
  },

  /**
   * 预览作品
   */
  previewArtwork(e) {
    const index = e.currentTarget.dataset.index
    const artwork = this.data.artworks[index]
    
    if (!artwork || !artwork.imageUrl) {
      wx.showToast({
        title: '图片加载失败',
        icon: 'none'
      })
      return
    }
    
    // 构造预览图片数组
    const imageUrls = this.data.artworks
      .filter(item => item.imageUrl)
      .map(item => item.imageUrl)
    
    wx.previewImage({
      current: artwork.imageUrl,
      urls: imageUrls
    })
  },

  /**
   * 下载作品
   */
  downloadArtwork(e) {
    const artwork = e.currentTarget.dataset.item
    
    if (!artwork.imageUrl) {
      wx.showToast({
        title: '图片不存在',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    wx.downloadFile({
      url: artwork.imageUrl,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.hideLoading()
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            wx.hideLoading()
            console.error('保存图片失败:', err)
            
            if (err.errMsg.includes('auth')) {
              wx.showModal({
                title: '需要授权',
                content: '请授权保存图片到相册',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting()
                  }
                }
              })
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('下载图片失败:', err)
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 分享作品
   */
  shareArtwork(e) {
    const artwork = e.currentTarget.dataset.item
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  /**
   * 删除作品
   */
  deleteArtwork(e) {
    const artwork = e.currentTarget.dataset.item
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个作品吗？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteArtwork(artwork)
        }
      }
    })
  },

  /**
   * 执行删除作品
   */
  performDeleteArtwork(artwork) {
    wx.showLoading({ title: '删除中...' })
    
    api.delete(`/ai/task/${artwork.id}`, {}, {
      success: () => {
        wx.hideLoading()
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        
        // 从列表中移除
        const artworks = this.data.artworks.filter(item => item.id !== artwork.id)
        this.setData({ artworks })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('删除作品失败:', err)
        
        wx.showToast({
          title: err.message || '删除失败',
          icon: 'none'
        })
      }
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