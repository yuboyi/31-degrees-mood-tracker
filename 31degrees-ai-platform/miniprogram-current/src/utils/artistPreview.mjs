export function previewRect(template, width, height, side = 'front') {
  const area = side === 'back' ? template.back_print_area : template.print_area
  if (!template.preview_ready || !area) throw new Error('后台尚未配置该面的有效打印区域')
  return { x: area.x * width, y: area.y * height,
    width: area.width * width, height: area.height * height }
}

export function clipArtistArea(ctx, template, area) {
  const { x, y, width: w, height: h } = area
  ctx.beginPath()
  if (template.shape === 'circle') {
    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    ctx.scale(w / 2, h / 2)
    ctx.arc(0, 0, 1, 0, Math.PI * 2)
    ctx.restore()
  } else if (template.bezier_controls?.length === 4) {
    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]]
    ctx.moveTo(x, y)
    for (let i = 0; i < 4; i++) {
      const end = corners[(i + 1) % 4]
      const control = template.bezier_controls[i]
      if (control) ctx.quadraticCurveTo(x + control.x * w / 100, y + control.y * h / 100,
        x + end[0] * w, y + end[1] * h)
      else ctx.lineTo(x + end[0] * w, y + end[1] * h)
    }
  } else {
    const radius = Math.min(50, Math.max(0, template.border_radius || 0)) / 100
    const rx = w * radius, ry = h * radius
    ctx.moveTo(x + rx, y)
    ctx.lineTo(x + w - rx, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + ry)
    ctx.lineTo(x + w, y + h - ry)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h)
    ctx.lineTo(x + rx, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - ry)
    ctx.lineTo(x, y + ry)
    ctx.quadraticCurveTo(x, y, x + rx, y)
  }
  ctx.closePath()
  ctx.clip()
}

export function artistBounds(template, area) {
  if (template.shape === 'circle' || template.bezier_controls?.length !== 4) return area
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const xs = [0, 1], ys = [0, 1]
  for (let i = 0; i < 4; i++) {
    const control = template.bezier_controls[i]
    if (!control) continue
    for (const [axis, values, key] of [[0, xs, 'x'], [1, ys, 'y']]) {
      const start = corners[i][axis], end = corners[(i + 1) % 4][axis], c = control[key] / 100
      const denominator = start - 2 * c + end
      if (!denominator) continue
      const t = (start - c) / denominator
      if (t > 0 && t < 1) values.push((1 - t) ** 2 * start + 2 * (1 - t) * t * c + t ** 2 * end)
    }
  }
  const left = Math.min(...xs), top = Math.min(...ys)
  return { x: area.x + left * area.width, y: area.y + top * area.height,
    width: (Math.max(...xs) - left) * area.width, height: (Math.max(...ys) - top) * area.height }
}

export function isOfficialTemplate(template) {
  return template?.source === 'admin_snapshot'
}
