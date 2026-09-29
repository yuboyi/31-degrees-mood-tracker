// 公共请求工具：登录、请求、上传、URL 归一化
// 运行环境：微信小程序「AI 开发模式」模型上下文（wx.modelContext），wx 为全局对象。
// 约定：wx.request / wx.uploadFile 的响应对象含 statusCode 与 data，data 可能为字符串，需兼容 JSON.parse。

const BASE = wx.getStorageSync('api_base_url') || 'https://ai.31du.com/mp-api'
const TOKEN_KEY = 'token'

// 兼容 data 为字符串时 JSON.parse
function parseJson(data) {
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch (e) {
    return null
  }
}

// 从响应体提取中文错误消息
function errorMessage(body, fallback) {
  if (body && typeof body === 'object') {
    return body.msg || body.message || body.detail || body.error || fallback
  }
  return fallback
}

function successful(res, body) {
  return res.statusCode >= 200 && res.statusCode < 300 && body &&
    typeof body === 'object' && body.success !== false && body.status !== 'failed' &&
    (body.code === undefined || body.code === null || body.code === 0 || body.code === '0')
}

/**
 * 确保已登录：无 token 时先 wx.login 拿 code，再 POST /auth/wx-login 换取 token 并缓存。
 * 成功 resolve token，失败 reject 中文错误。
 */
function ensureLogin() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY)
    if (token) {
      resolve(token)
      return
    }
    wx.login({
      success(loginRes) {
        const code = loginRes && loginRes.code
        if (!code) {
          reject(new Error('微信登录失败，未获取到 code'))
          return
        }
        wx.request({
          url: BASE + '/auth/wx-login',
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code },
          timeout: 15000,
          success(res) {
            const body = parseJson(res.data)
            if (successful(res, body) && typeof body.token === 'string' && body.token) {
              wx.setStorageSync(TOKEN_KEY, body.token)
              resolve(body.token)
            } else {
              reject(new Error(errorMessage(body, '登录失败')))
            }
          },
          fail(err) {
            reject(new Error((err && err.errMsg) || '登录失败'))
          }
        })
      },
      fail(err) {
        reject(new Error((err && err.errMsg) || '微信登录失败'))
      }
    })
  })
}

/**
 * 通用请求。url = BASE + path；header 带 Authorization: Bearer token。
 * 2xx 且 body.success !== false 时返回 data；否则 throw Error(中文消息)。
 */
async function request(path, data, method) {
  await ensureLogin()
  const token = wx.getStorageSync(TOKEN_KEY)
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE + path,
      method: method || 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      data: data || {},
      timeout: 180000,
      success(res) {
        const body = parseJson(res.data)
        if (successful(res, body)) {
          resolve(body)
          return
        }
        reject(new Error(errorMessage(body, '服务接口不可用或返回格式不匹配')))
      },
      fail(err) {
        reject(new Error((err && err.errMsg) || '网络错误'))
      }
    })
  })
}

/**
 * 上传文件，返回可访问的 url。
 * 先确保登录态，并携带 Authorization 头（后端 /upload 需要鉴权）。
 */
async function uploadFile(filePath) {
  await ensureLogin()
  const token = wx.getStorageSync(TOKEN_KEY)
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE + '/upload',
      filePath,
      name: 'file',
      header: {
        'Authorization': token ? 'Bearer ' + token : ''
      },
      timeout: 180000,
      success(res) {
        const body = parseJson(res.data)
        if (successful(res, body)) {
          const url = (body && (body.url || body.data)) || ''
          if (typeof url === 'string' && url) {
            resolve(url)
          } else {
            reject(new Error(errorMessage(body, '上传失败')))
          }
          return
        }
        reject(new Error(errorMessage(body, '上传失败')))
      },
      fail(err) {
        reject(new Error((err && err.errMsg) || '上传失败'))
      }
    })
  })
}

/**
 * 归一化 url 为完整可访问地址：
 * - '' → ''
 * - data:/wxfile:/blob: 原样返回
 * - http/https 开头原样返回
 * - 以 / 开头 → BASE 去掉 /api 前缀 + url
 * - 否则 → BASE origin + '/' + url
 */
function normalizeUrl(url) {
  if (!url) return ''
  if (typeof url !== 'string') url = String(url)
  if (/^(data:|wxfile:|blob:|https?:)/.test(url)) return url
  const origin = BASE.replace(/\/(?:mp-api|api)\/?$/, '')
  if (url.indexOf('/') === 0) return origin + url
  return origin + '/' + url
}

module.exports = {
  BASE,
  TOKEN_KEY,
  ensureLogin,
  request,
  uploadFile,
  normalizeUrl
}
