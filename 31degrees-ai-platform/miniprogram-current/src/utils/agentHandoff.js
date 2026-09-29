import { useAgentHandoffStore } from '@/stores/agentHandoff'

/**
 * 获取页面接力(handoff)的 pinia store 实例。
 * 需在 pinia 已激活（app.use(pinia) 之后，或页面/组件生命周期内）调用，
 * 供页面在 onLoad/onShow 中读取、消费 handoff 数据。
 */
export function getAgentHandoffStore() {
  return useAgentHandoffStore()
}

/**
 * 把 'a=1&b=x%20y' 形式的查询串解析为对象，并对 key/value 做 decodeURIComponent。
 * - 空串 / 非字符串（null/undefined）返回空对象；已是对象时原样返回。
 * - 同名键重复出现时合并为数组。
 * - decodeURIComponent 解析失败时保留原始片段，避免抛错中断流程。
 */
export function decodeQuery(queryString) {
  const result = {}
  if (!queryString) return result
  if (typeof queryString !== 'string') return queryString || result
  const str = queryString.replace(/^\?/, '')
  if (!str) return result

  const pairs = str.split('&')
  for (const pair of pairs) {
    if (!pair) continue
    const idx = pair.indexOf('=')
    const rawKey = idx === -1 ? pair : pair.slice(0, idx)
    const rawVal = idx === -1 ? '' : pair.slice(idx + 1)

    let key
    let val
    try {
      key = decodeURIComponent(rawKey)
      val = decodeURIComponent(rawVal)
    } catch (e) {
      key = rawKey
      val = rawVal
    }

    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = Array.isArray(result[key])
        ? result[key].concat(val)
        : [result[key], val]
    } else {
      result[key] = val
    }
  }
  return result
}

/**
 * 把对象序列化为 'a=1&b=x' 形式的查询串，key/value 做 encodeURIComponent。
 * - 忽略值为 undefined / null 的键。
 * - 数组值展开为多个同名键。
 */
export function buildQuery(obj) {
  if (!obj || typeof obj !== 'object') return ''
  const parts = []
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const v of value) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }
  return parts.join('&')
}
