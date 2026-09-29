// Parse QR input only. Authorization and binding must still be checked by API.
const invalid = () => ({ kind: 'invalid' })

function positiveId(value) {
  const text = String(value)
  const id = Number(text)
  return /^[1-9]\d*$/.test(text) && Number.isSafeInteger(id) ? id : null
}

function parseValue(value) {
  const text = decodeURIComponent(value)
  if (text.startsWith('store_')) {
    const id = positiveId(text.slice(6))
    return id ? { kind: 'store', storeId: id, scene: text } : invalid()
  }
  if (/^machine_[A-Za-z0-9_-]{1,100}$/.test(text)) {
    return { kind: 'machine', machineCode: text.slice(8), scene: text }
  }
  // Tenant scenes are opaque server-issued values, never numeric store IDs.
  if (/^t[a-z0-9]+_[a-z0-9]+$/i.test(text)) return { kind: 'tenant', scene: text }
  const url = text.match(/^https?:\/\/(ai\.31du\.com|www\.31du\.com|31du\.com|quickin\.top)\/[^?#]*\?([^#]*)$/i)
  if (url) {
    const params = {}
    for (const part of url[2].split('&')) {
      const index = part.indexOf('=')
      const key = decodeURIComponent(index < 0 ? part : part.slice(0, index))
      if (!['scene', 'store_id'].includes(key)) continue
      if (Object.prototype.hasOwnProperty.call(params, key)) return invalid()
      params[key] = index < 0 ? '' : part.slice(index + 1)
    }
    if (params.scene && /^https?:/i.test(decodeURIComponent(params.scene))) return invalid()
    return parseQrEntry(params)
  }
  return invalid()
}

export function parseQrEntry(options = {}) {
  try {
    const entries = []
    for (const key of ['scene', 'q']) {
      if (options[key]) {
        if (typeof options[key] !== 'string' || options[key].length > 2048) return invalid()
        entries.push(parseValue(options[key]))
      }
    }
    if (options.store_id !== undefined && options.store_id !== '') {
      const id = positiveId(decodeURIComponent(String(options.store_id)))
      entries.push(id ? { kind: 'store', storeId: id, scene: `store_${id}` } : invalid())
    }
    if (!entries.length || entries.some(entry => entry.kind === 'invalid')) return invalid()
    const first = entries[0]
    if (entries.some(entry => entry.kind !== first.kind || entry.scene !== first.scene)) return invalid()
    return first
  } catch {
    return invalid()
  }
}
