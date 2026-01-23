// utils/auth.js
// 认证工具类

const api = require('./api.js')

/**
 * 微信小程序登录
 */
function login() {
  return new Promise((resolve, reject) => {
    // 获取微信登录凭证
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端登录接口
          loginWithCode(res.code)
            .then(result => resolve(result))
            .catch(err => reject(err))
        } else {
          console.error('微信登录失败:', res.errMsg)
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          })
          reject(new Error('获取微信登录凭证失败'))
        }
      },
      fail: (err) => {
        console.error('wx.login失败:', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * 使用code调用后端登录接口
 */
function loginWithCode(code) {
  return new Promise((resolve, reject) => {
    // 获取用户信息
    getUserProfile()
      .then(userInfo => {
        // 调用后端登录接口
        api.request({
          url: '/auth/wechat/login',
          method: 'POST',
          data: {
            code: code,
            userInfo: userInfo
          },
          requireAuth: false,
          success: (res) => {
            const data = res.data
            if (data) {
              // 保存登录信息
              const app = getApp()
              app.setLoginInfo(data.accessToken, data.userInfo)
              
              console.log('登录成功:', data.userInfo)
              wx.showToast({
                title: data.isNewUser ? '欢迎新用户!' : '登录成功',
                icon: 'success'
              })
              
              resolve({
                token: data.accessToken,
                userInfo: data.userInfo,
                isNewUser: data.isNewUser
              })
            } else {
              reject(new Error('登录响应数据格式错误'))
            }
          },
          fail: (err) => {
            console.error('后端登录失败:', err)
            wx.showToast({
              title: err.message || '登录失败',
              icon: 'none'
            })
            reject(err)
          }
        })
      })
      .catch(err => {
        console.error('获取用户信息失败:', err)
        // 即使获取用户信息失败，也尝试登录
        api.request({
          url: '/auth/wechat/login',
          method: 'POST',
          data: { code: code },
          requireAuth: false,
          success: (res) => {
            const data = res.data
            if (data) {
              const app = getApp()
              app.setLoginInfo(data.accessToken, data.userInfo)
              
              wx.showToast({
                title: '登录成功',
                icon: 'success'
              })
              
              resolve({
                token: data.accessToken,
                userInfo: data.userInfo,
                isNewUser: data.isNewUser
              })
            }
          },
          fail: (err) => {
            reject(err)
          }
        })
      })
  })
}

/**
 * 获取用户信息
 */
function getUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        console.log('获取用户信息成功:', userInfo)
        resolve({
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender,
          city: userInfo.city,
          province: userInfo.province,
          country: userInfo.country,
          language: userInfo.language
        })
      },
      fail: (err) => {
        console.log('获取用户信息失败:', err)
        // 不强制要求用户信息，返回空对象
        resolve({})
      }
    })
  })
}

/**
 * 检查登录状态
 */
function checkLogin() {
  const app = getApp()
  return app.globalData.isLogin
}

/**
 * 退出登录
 */
function logout() {
  return new Promise((resolve) => {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.clearLoginInfo()
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          
          // 跳转到首页
          wx.reLaunch({
            url: '/pages/index/index'
          })
          
          resolve(true)
        } else {
          resolve(false)
        }
      }
    })
  })
}

/**
 * 静默登录（自动使用存储的登录信息）
 */
function silentLogin() {
  return new Promise((resolve, reject) => {
    const app = getApp()
    
    if (app.globalData.isLogin) {
      // 已经登录，验证token有效性
      api.request({
        url: '/auth/validate',
        method: 'POST',
        showLoading: false,
        success: () => {
          resolve(true)
        },
        fail: () => {
          // token无效，清除登录状态并重新登录
          app.clearLoginInfo()
          login().then(() => resolve(true)).catch(err => reject(err))
        }
      })
    } else {
      // 未登录，尝试自动登录
      login().then(() => resolve(true)).catch(err => reject(err))
    }
  })
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  const app = getApp()
  return app.globalData.userInfo
}

/**
 * 更新用户信息
 */
function updateUserInfo(userInfo) {
  return new Promise((resolve, reject) => {
    api.request({
      url: '/user/profile',
      method: 'PUT',
      data: userInfo,
      success: (res) => {
        // 更新本地存储的用户信息
        const app = getApp()
        const currentUserInfo = app.globalData.userInfo
        const updatedUserInfo = Object.assign({}, currentUserInfo, userInfo)
        
        app.globalData.userInfo = updatedUserInfo
        wx.setStorageSync('userInfo', updatedUserInfo)
        
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
        
        resolve(updatedUserInfo)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 强制要求登录
 */
function requireLogin() {
  const app = getApp()
  
  if (!app.globalData.isLogin) {
    wx.showModal({
      title: '登录提示',
      content: '请先登录后再使用该功能',
      confirmText: '立即登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          login()
        }
      }
    })
    return false
  }
  
  return true
}

module.exports = {
  login,
  logout,
  checkLogin,
  silentLogin,
  getCurrentUser,
  updateUserInfo,
  requireLogin,
  getUserProfile
}