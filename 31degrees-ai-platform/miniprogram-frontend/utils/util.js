// utils/util.js
// 通用工具函数

/**
 * 格式化时间
 * @param {Date|number|string} date 时间
 * @param {string} format 格式 如：'YYYY-MM-DD HH:mm:ss'
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours()
  const minute = d.getMinutes()
  const second = d.getSeconds()
  
  const formatNumber = (n) => n < 10 ? '0' + n : n
  
  return format
    .replace('YYYY', year)
    .replace('MM', formatNumber(month))
    .replace('DD', formatNumber(day))
    .replace('HH', formatNumber(hour))
    .replace('mm', formatNumber(minute))
    .replace('ss', formatNumber(second))
}

/**
 * 相对时间格式化
 * @param {Date|number|string} date 时间
 */
function formatRelativeTime(date) {
  if (!date) return ''
  
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  
  const minute = 1000 * 60
  const hour = minute * 60
  const day = hour * 24
  const month = day * 30
  const year = day * 365
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < month) {
    return Math.floor(diff / day) + '天前'
  } else if (diff < year) {
    return Math.floor(diff / month) + '个月前'
  } else {
    return Math.floor(diff / year) + '年前'
  }
}

/**
 * 防抖函数
 * @param {Function} func 要执行的函数
 * @param {number} delay 延迟时间
 */
function debounce(func, delay = 300) {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * 节流函数
 * @param {Function} func 要执行的函数
 * @param {number} delay 延迟时间
 */
function throttle(func, delay = 300) {
  let timer
  return function(...args) {
    if (timer) return
    timer = setTimeout(() => {
      func.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 深拷贝
 * @param {any} obj 要拷贝的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 */
function randomString(length = 8) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 文件大小格式化
 * @param {number} bytes 字节数
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 验证手机号
 * @param {string} phone 手机号
 */
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证邮箱
 * @param {string} email 邮箱
 */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 获取文件扩展名
 * @param {string} filename 文件名
 */
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * 选择图片
 * @param {Object} options 选项
 */
function chooseImage(options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      count: 1,
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera']
    }
    
    const finalOptions = Object.assign({}, defaultOptions, options)
    
    wx.chooseImage({
      ...finalOptions,
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * 预览图片
 * @param {string|Array} urls 图片地址
 * @param {number} current 当前显示图片的索引
 */
function previewImage(urls, current = 0) {
  if (typeof urls === 'string') {
    urls = [urls]
  }
  
  wx.previewImage({
    urls: urls,
    current: urls[current] || urls[0]
  })
}

/**
 * 保存图片到相册
 * @param {string} url 图片地址
 */
function saveImageToAlbum(url) {
  return new Promise((resolve, reject) => {
    // 先下载图片
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
              resolve(true)
            },
            fail: (err) => {
              if (err.errMsg.includes('auth deny')) {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权保存图片到相册',
                  confirmText: '去设置',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
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
              reject(err)
            }
          })
        } else {
          wx.showToast({
            title: '下载图片失败',
            icon: 'none'
          })
          reject(new Error('下载图片失败'))
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '下载图片失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * 分享功能
 * @param {string} title 分享标题
 * @param {string} path 分享路径
 * @param {string} imageUrl 分享图片
 */
function shareContent(title = '31度文创精灵', path = '/pages/index/index', imageUrl = '') {
  return {
    title: title,
    path: path,
    imageUrl: imageUrl
  }
}

/**
 * 设置页面标题
 * @param {string} title 页面标题
 */
function setPageTitle(title) {
  wx.setNavigationBarTitle({
    title: title
  })
}

/**
 * 显示操作菜单
 * @param {Array} itemList 菜单项
 */
function showActionSheet(itemList) {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        resolve(res.tapIndex)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 复制到剪贴板
 * @param {string} data 要复制的内容
 * @param {string} tip 提示文本
 */
function copyToClipboard(data, tip = '复制成功') {
  wx.setClipboardData({
    data: data,
    success: () => {
      wx.showToast({
        title: tip,
        icon: 'success'
      })
    }
  })
}

/**
 * 获取系统信息
 */
function getSystemInfo() {
  return new Promise((resolve) => {
    wx.getSystemInfo({
      success: (res) => {
        resolve(res)
      },
      fail: () => {
        resolve({})
      }
    })
  })
}

module.exports = {
  formatTime,
  formatRelativeTime,
  debounce,
  throttle,
  deepClone,
  randomString,
  formatFileSize,
  validatePhone,
  validateEmail,
  getFileExtension,
  chooseImage,
  previewImage,
  saveImageToAlbum,
  shareContent,
  setPageTitle,
  showActionSheet,
  copyToClipboard,
  getSystemInfo
}