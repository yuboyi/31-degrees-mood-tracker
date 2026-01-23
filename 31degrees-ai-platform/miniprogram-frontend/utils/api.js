// utils/api.js
// Unified request helpers for the 31 Degrees mini program.

const app = getApp()

const DEFAULT_BASE_URL = 'https://api.31degrees.com/api' // TODO: replace with environment specific endpoint

function resolveBaseUrl() {
  try {
    const runtimeApp = getApp()
    return (runtimeApp && runtimeApp.globalData && runtimeApp.globalData.apiBaseUrl) || DEFAULT_BASE_URL
  } catch (err) {
    console.warn('Unable to resolve global app instance, falling back to default API host.', err)
    return DEFAULT_BASE_URL
  }
}

/**
 * Core wrapper around wx.request
 * @param {Object} options
 * @param {string} options.url               Request path or absolute URL
 * @param {string} [options.method='GET']    HTTP method
 * @param {Object} [options.data]            Payload
 * @param {Function} [options.success]       Callback when business code === 200
 * @param {Function} [options.fail]          Callback when request or business fails
 * @param {boolean} [options.showLoading=true] Whether to display a loading toast
 * @param {boolean} [options.requireAuth=true] Whether the request requires login
 * @param {number}  [options.timeout=30000]  Timeout in ms
 */
function request(options = {}) {
  const defaultOptions = {
    method: 'GET',
    data: {},
    showLoading: true,
    requireAuth: true,
    timeout: 30000
  }

  const opts = Object.assign({}, defaultOptions, options)

  if (opts.requireAuth && !app.globalData?.isLogin) {
    wx.showModal({
      title: 'Sign-in Required',
      content: 'Please sign in before using this feature.',
      confirmText: 'Sign in',
      success: (res) => {
        if (res.confirm) {
          const auth = require('./auth.js')
          auth.login()
        }
      }
    })
    return
  }

  if (opts.showLoading) {
    wx.showLoading({
      title: 'Loading...',
      mask: true
    })
  }

  let url = opts.url
  if (!url.startsWith('http')) {
    url = `${resolveBaseUrl()}${url}`
  }

  const header = Object.assign({
    'Content-Type': 'application/json'
  }, opts.header || {})

  if (opts.requireAuth && app.globalData?.token) {
    header.Authorization = `Bearer ${app.globalData.token}`
  }

  wx.request({
    url,
    method: opts.method,
    data: opts.data,
    header,
    timeout: opts.timeout,
    success: (res) => {
      if (res.statusCode === 200 && res.data && res.data.code === 200) {
        opts.success && opts.success(res.data)
        return
      }

      if (res.statusCode === 401) {
        console.warn('Auth expired, clearing session.')
        app.clearLoginInfo && app.clearLoginInfo()
        wx.showModal({
          title: 'Session expired',
          content: 'Please sign in again to continue.',
          showCancel: false,
          success: () => {
            wx.reLaunch({ url: '/pages/index/index' })
          }
        })
        return
      }

      const message = res.data?.message || `Request failed (${res.statusCode})`
      console.error('API business error:', res.statusCode, res.data)
      if (opts.fail) {
        opts.fail({ message, statusCode: res.statusCode, data: res.data })
      } else {
        wx.showToast({ title: message, icon: 'none', duration: 2000 })
      }
    },
    fail: (err) => {
      console.error('Network error:', err)
      if (opts.fail) {
        opts.fail(err)
      } else {
        const message = err.errMsg?.includes('timeout') ? 'Network timeout, please try again.' : 'Network error, please retry.'
        wx.showToast({ title: message, icon: 'none', duration: 2000 })
      }
    },
    complete: () => {
      if (opts.showLoading) {
        wx.hideLoading()
      }
      opts.complete && opts.complete()
    }
  })
}

function uploadFile(options = {}) {
  if (!options.filePath) {
    wx.showToast({ title: 'Please choose a file to upload.', icon: 'none' })
    return
  }

  if (!app.globalData?.isLogin) {
    wx.showModal({
      title: 'Sign-in Required',
      content: 'Please sign in before uploading files.',
      confirmText: 'Sign in'
    })
    return
  }

  wx.showLoading({ title: 'Uploading...', mask: true })

  const url = options.url && options.url.startsWith('http')
    ? options.url
    : `${resolveBaseUrl()}${options.url || '/upload/image'}`

  const header = Object.assign({}, options.header)
  if (app.globalData?.token) {
    header.Authorization = `Bearer ${app.globalData.token}`
  }

  wx.uploadFile({
    url,
    filePath: options.filePath,
    name: options.name || 'file',
    formData: options.formData || {},
    header,
    success: (res) => {
      try {
        const data = JSON.parse(res.data)
        if (data.code === 200) {
          options.success && options.success(data)
        } else {
          const message = data.message || 'Upload failed'
          options.fail ? options.fail({ message }) : wx.showToast({ title: message, icon: 'none' })
        }
      } catch (err) {
        console.error('Failed to parse upload response:', err)
        options.fail ? options.fail({ message: 'Upload failed', error: err }) : wx.showToast({ title: 'Upload failed', icon: 'none' })
      }
    },
    fail: (err) => {
      console.error('File upload failed:', err)
      const message = err.errMsg?.includes('timeout') ? 'Upload timeout, please retry.' : 'Upload failed, please retry.'
      options.fail ? options.fail({ message, ...err }) : wx.showToast({ title: message, icon: 'none' })
    },
    complete: () => {
      wx.hideLoading()
      options.complete && options.complete()
    }
  })
}

const get = (url, data, options = {}) => request({ url, data, method: 'GET', ...options })
const post = (url, data, options = {}) => request({ url, data, method: 'POST', ...options })
const put = (url, data, options = {}) => request({ url, data, method: 'PUT', ...options })
const del = (url, data, options = {}) => request({ url, data, method: 'DELETE', ...options })

module.exports = {
  request,
  uploadFile,
  get,
  post,
  put,
  delete: del,
  API_BASE_URL: DEFAULT_BASE_URL,
  resolveBaseUrl
}