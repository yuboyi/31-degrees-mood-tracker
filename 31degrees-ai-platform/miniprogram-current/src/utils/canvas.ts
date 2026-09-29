/**
 * Canvas 2D 图片编辑工具函数
 * 微信小程序专用 Canvas 2D API
 */

/** 获取 Canvas 节点和 2D 上下文 */
export function getCanvasContext(
  selector: string = '#editorCanvas',
  component?: any
): Promise<{ canvas: any; ctx: any; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const query = component
      ? uni.createSelectorQuery().in(component)
      : uni.createSelectorQuery()

    query
      .select(selector)
      .fields({ node: true, size: true })
      .exec((res: any) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas 节点未找到，请检查 canvas 元素是否已渲染'))
          return
        }

        const canvas = res[0].node
        const dpr = uni.getSystemInfoSync().pixelRatio
        const width = res[0].width
        const height = res[0].height

        canvas.width = width * dpr
        canvas.height = height * dpr

        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)

        resolve({ canvas, ctx, width, height })
      })
  })
}

/** 在 Canvas 2D 中加载图片 */
export function loadImageOnCanvas(
  canvas: any,
  src: string
): Promise<{ image: any; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage()
    img.onload = () => {
      resolve({ image: img, width: img.width, height: img.height })
    }
    img.onerror = (e: any) => {
      reject(new Error(`图片加载失败: ${src}`))
    }
    img.src = src
  })
}

/** 清空 Canvas */
export function clearCanvas(ctx: any, width: number, height: number) {
  ctx.clearRect(0, 0, width, height)
}

/** 填充纯色背景 */
export function fillBackground(ctx: any, width: number, height: number, color: string = '#ffffff') {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
}

/** 在 Canvas 上绘制图片（支持缩放/旋转/偏移） */
export function drawImageTransformed(
  ctx: any,
  img: any,
  canvasW: number,
  canvasH: number,
  options: {
    scale?: number
    rotation?: number
    offsetX?: number
    offsetY?: number
  } = {}
) {
  const { scale = 1, rotation = 0, offsetX = 0, offsetY = 0 } = options

  ctx.save()
  ctx.translate(canvasW / 2 + offsetX, canvasH / 2 + offsetY)
  ctx.scale(scale, scale)
  ctx.rotate((rotation * Math.PI) / 180)

  const imgW = img.width
  const imgH = img.height
  ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH)
  ctx.restore()
}

/** 在 Canvas 上绘制叠加层（模板 overlay） */
export function drawOverlay(
  ctx: any,
  img: any,
  width: number,
  height: number,
  alpha: number = 0.85
) {
  ctx.globalAlpha = alpha
  ctx.drawImage(img, 0, 0, width, height)
  ctx.globalAlpha = 1.0
}

/** 计算图片自适应缩放比例 */
export function calcFitScale(
  imgW: number,
  imgH: number,
  canvasW: number,
  canvasH: number
): number {
  const imgRatio = imgW / imgH
  const canvasRatio = canvasW / canvasH
  if (imgRatio > canvasRatio) {
    return canvasH / imgH
  }
  return canvasW / imgW
}

/** 导出 Canvas 为临时文件 */
export function canvasToTempFile(
  canvas: any,
  fileType: string = 'png',
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvas,
      fileType,
      quality,
      success: (res: any) => resolve(res.tempFilePath),
      fail: (err: any) => reject(err),
    })
  })
}

/** 保存图片到相册 */
export function saveToAlbum(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(),
      fail: (err: any) => {
        // 权限被拒时引导用户
        if (err.errMsg?.includes('auth deny')) {
          uni.showModal({
            title: '权限提示',
            content: '需要相册权限来保存照片，请在设置中开启',
            success: (res: any) => {
              if (res.confirm) {
                uni.openSetting({})
              }
            },
          })
        }
        reject(err)
      },
    })
  })
}

/** 预览图片 */
export function previewImage(urls: string[], current: number = 0) {
  uni.previewImage({ urls, current })
}
