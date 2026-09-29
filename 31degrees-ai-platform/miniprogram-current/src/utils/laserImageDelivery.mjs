const formats = new Set(['both', 'bmp', 'png'])

export function rasterUploadExtension(file, path) {
  // H5 tempFilePaths are blob URLs; the selected File retains its real name.
  const name = String(file?.name || path || '').split(/[?#]/, 1)[0]
  const extension = name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'bmp'].includes(extension)) return extension
  if (!file?.name && String(path).startsWith('blob:')) {
    return ({'image/png':'png','image/jpeg':'jpg','image/bmp':'bmp','image/x-ms-bmp':'bmp'})[file?.type] || ''
  }
  return ''
}

export function validateRasterDownload(buffer, format) {
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 26 || bytes.length > 64 * 1024 * 1024) throw new Error('图片文件为空、损坏或过大')
  const signature = format === 'png' ? [137,80,78,71,13,10,26,10] : format === 'bmp' ? [66,77] : []
  if (!signature.length || !signature.every((value,index) => bytes[index] === value)) {
    throw new Error('返回的不是所选格式的图片，未保存')
  }
}

export function laserImagesReady(format, pngUrl, bmpUrl, previewOnly = false) {
  if (!formats.has(format) || previewOnly) return false
  return Boolean(pngUrl && (format === 'png' || bmpUrl))
}

// Image handoff is independent of machine instructions and optional previews.
export async function generateLaserImages({ processing, imageUrl, maskUrl, format, sourceKind = 'photo',
  normalizeUrl = value => value, onOutput = () => {}, onStage = () => {} }) {
  if (!formats.has(format)) throw new Error('不支持的图片交付格式')
  if (!['photo', 'gray'].includes(sourceKind)) throw new Error('不支持的图片来源')
  if (sourceKind === 'gray') {
    onStage('保留已有灰度', 38)
    const depth = await processing.importGray(imageUrl)
    const pngUrl = normalizeUrl(depth.depth_url || '')
    const bmpUrl = normalizeUrl(depth.bmp_url || '')
    if (!laserImagesReady(format, pngUrl, bmpUrl) || depth.is_ai !== false || depth.source !== 'authored-grayscale-import') {
      throw new Error('灰度图交付结果不完整或来源不匹配')
    }
    onOutput({ pngUrl, bmpUrl, depth })
    return { pngUrl, bmpUrl, previewWarning: '已有灰度图原样交付，未重新推理深度或生成3D。' }
  }
  onStage('灰度深度图', 38)
  const depth = await processing.depthMap(imageUrl, maskUrl || undefined)
  const pngUrl = normalizeUrl(depth.depth_url || '')
  if (!pngUrl) throw new Error('未生成灰度 PNG 图片')
  onOutput({ pngUrl, depth })

  let bmpUrl = ''
  if (format !== 'png') {
    onStage('BMP位图', 56)
    const bmp = await processing.bmp(pngUrl)
    bmpUrl = normalizeUrl(bmp.bmp_url || '')
    if (!bmpUrl) throw new Error('未生成 BMP 图片；已保留 PNG，请重试或选择 PNG')
    onOutput({ bmpUrl })
  }

  onStage('2.5D预览', 80)
  let previewWarning = ''
  try {
    const preview = await processing.pod3d(imageUrl, 1.2, 45, 5, 32)
    const previewUrl = normalizeUrl(preview.output_url || preview.pod3d_url || '')
    if (!previewUrl) throw new Error('未返回预览图片')
    onOutput({ previewUrl, preview })
  } catch {
    previewWarning = '2.5D 效果预览暂不可用；PNG/BMP 图片已生成。'
  }
  return { pngUrl, bmpUrl, previewWarning }
}
