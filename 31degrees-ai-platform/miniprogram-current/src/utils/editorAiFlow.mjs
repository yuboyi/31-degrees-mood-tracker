export function serverImagePath(source, apiBase) {
  const origin = apiBase.replace(/\/[^/]+\/?$/, '')
  const path = source.startsWith(origin + '/') ? source.slice(origin.length) : source
  return /^\/uploads\/\d{6}\/u\d+\/[a-f0-9]{32}\.(png|jpe?g|webp)$/.test(path) ? path : null
}

export function resultImageUrl(result, kind, apiBase) {
  // A mask is not the foreground; raw SVG text is not an image URL.
  const key = { vector: 'preview_url', depth: 'depth_url', cutout: 'logo_url' }[kind]
  const value = result?.[key]
  if (typeof value !== 'string' || !value.trim()) throw new Error('处理服务未返回有效效果图，已保留原照片')
  const path = serverImagePath(value, apiBase)
  if (!path) throw new Error('效果图地址与当前服务不匹配，已保留原照片')
  return apiBase.replace(/\/[^/]+\/?$/, '') + path
}

export function createImageJobGate() {
  let revision = 0, busy = false
  return {
    invalidate() { revision++ },
    async run(source, prepare, process) {
      if (busy) return null
      busy = true
      const started = revision
      try {
        const input = await prepare(source)
        if (started !== revision) return null
        const result = await process(input)
        return started === revision ? result : null
      } catch (error) {
        if (started !== revision) return null
        throw error
      } finally { busy = false }
    },
  }
}
