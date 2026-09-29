import { clipArtistArea } from './artistPreview.mjs'

export function printArtworkPlan(template, side = 'front') {
  if (template?.source !== 'admin_snapshot' || !template.is_active || template.product_type !== 'inkjet') {
    throw new Error('请先选择已核准目录中的彩印模板')
  }
  if (template.price_cents !== 0) throw new Error('付费或价格未核准的模板须先完成正式支付校验，不能直接导出')
  if (!template.preview_ready || !(side === 'back' ? template.back_print_area : template.print_area)) {
    throw new Error('该面的印刷区域尚未配置，不能导出打印图')
  }
  if (!['rectangle', 'square', 'circle'].includes(template.shape) || template.bezier_controls?.length || template.overlay_url) {
    throw new Error('该异形模板需先核准输出轮廓，暂不能导出打印图')
  }
  const widthMm = Number(template.width_cm) * 10
  const heightMm = Number(template.height_cm) * 10
  const dpi = Number(template.dpi)
  if (![widthMm, heightMm, dpi].every(Number.isFinite) || widthMm <= 0 || heightMm <= 0 || dpi < 72 || dpi > 1440) {
    throw new Error('模板缺少有效印刷尺寸或分辨率，不能猜测尺寸')
  }
  const width = Math.round(widthMm / 25.4 * dpi)
  const height = Math.round(heightMm / 25.4 * dpi)
  if (width < 1 || height < 1 || width > 4096 || height > 4096 || width * height > 12000000) {
    throw new Error('该模板超过当前端高清导出范围，请由门店电脑处理；不会降低分辨率冒充高清')
  }
  return { width, height, widthMm, heightMm, dpi, side, templateId: template.source_record_id }
}

// Only customer artwork enters this renderer. Product mockups are never inputs.
// Both preview and export project the same physical-aspect design onto their canvas.
export function drawPrintArtwork(ctx, template, plan, image, state, outputWidth = plan.width, outputHeight = plan.height) {
  ctx.save()
  try {
    ctx.scale(outputWidth / plan.width, outputHeight / plan.height)
    clipArtistArea(ctx, template, { x: 0, y: 0, width: plan.width, height: plan.height })
    if (!image) {
      ctx.fillStyle = state.background
      ctx.fillRect(0, 0, plan.width, plan.height)
      return
    }
    const cover = Math.max(plan.width / image.width, plan.height / image.height)
    ctx.translate(plan.width * (0.5 + state.offsetX), plan.height * (0.5 + state.offsetY))
    ctx.rotate(state.rotation * Math.PI / 180)
    ctx.scale(cover * state.zoom, cover * state.zoom)
    ctx.drawImage(image, -image.width / 2, -image.height / 2)
  } finally { ctx.restore() }
}

export function effectivePhotoDpi(plan, image, zoom = 1) {
  if (!image) return null
  const cover = Math.max(plan.width / image.width, plan.height / image.height) * zoom
  return Math.floor(plan.dpi / cover)
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

// Canvas exports omit physical size. Embed pHYs, preserving compressed pixels/alpha.
export function pngWithDpi(input, dpi) {
  const source = input instanceof Uint8Array ? input : new Uint8Array(input)
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  if (!Number.isFinite(dpi) || dpi < 72 || dpi > 1440 || signature.some((x, i) => source[i] !== x)) throw new Error('无效PNG或分辨率')
  const chunk = new Uint8Array(21)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, 9)
  chunk.set([112, 72, 89, 115], 4)
  view.setUint32(8, Math.round(dpi / 0.0254))
  view.setUint32(12, Math.round(dpi / 0.0254))
  chunk[16] = 1
  view.setUint32(17, crc32(chunk.subarray(4, 17)))
  const parts = [source.slice(0, 8)]
  let offset = 8, header = false, end = false
  while (offset + 12 <= source.length) {
    const length = new DataView(source.buffer, source.byteOffset + offset, 4).getUint32(0)
    const next = offset + length + 12
    if (next > source.length) throw new Error('PNG数据不完整')
    const type = String.fromCharCode(...source.subarray(offset + 4, offset + 8))
    if (!header && type !== 'IHDR') throw new Error('PNG缺少图像头')
    if (type !== 'pHYs') parts.push(source.slice(offset, next))
    if (type === 'IHDR') { if (header) throw new Error('重复图像头'); header = true; parts.push(chunk) }
    offset = next
    if (type === 'IEND') { end = true; break }
  }
  if (!header || !end || offset !== source.length) throw new Error('PNG数据不完整')
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let cursor = 0
  for (const part of parts) { output.set(part, cursor); cursor += part.length }
  return output
}
