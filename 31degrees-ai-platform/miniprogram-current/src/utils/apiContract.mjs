export const API_BASE_URL = 'https://ai.31du.com/mp-api'

export function validateApiResponse(statusCode, data, path = '') {
  let body = data
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch {
      throw new Error('服务接口未正确连接，返回的不是 JSON 数据')
    }
  }
  if (!body || typeof body !== 'object') {
    throw new Error('服务接口返回了无效数据')
  }
  const detail = typeof body.detail === 'string' ? body.detail : body.detail?.message
  const message = body.msg || body.message || detail || body.error
  if (statusCode < 200 || statusCode >= 300 || body.success === false || body.status === 'failed' ||
      (body.code !== undefined && body.code !== null && body.code !== 0 && body.code !== '0')) {
    throw new Error(typeof message === 'string' ? message : '请求失败')
  }
  const listKey = path === '/template-types' ? 'template_types'
    : ['/templates', '/templates/hot'].includes(path) ? 'templates' : null
  if (listKey && !Array.isArray(body[listKey])) {
    throw new Error('模板接口格式与当前小程序不匹配，请联系管理员')
  }
  return body
}
