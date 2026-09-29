// 原子接口：startPhotoEngraving —— 照片转 2.5D 内雕加工包
// 流程：upload → (可选 optimize) → depth-map → bmp → pod-3d → z-axis-25d
const { request, uploadFile, normalizeUrl } = require('./_request')

module.exports = async function startPhotoEngraving(args) {
  args = args || {}
  const imagePath = args.imagePath
  const material = args.material || '水晶'
  const sizeText = args.sizeText || '80x80x80mm'
  const optimize = !!args.optimize

  try {
    if (!imagePath) {
      throw new Error('请先上传一张照片')
    }

    // 1. 上传图片
    const uploadedUrl = await uploadFile(imagePath)

    // 2. 可选：先做画质增强，用 optimized_url 作为后续输入
    let sourceUrl = uploadedUrl
    if (optimize) {
      const optRes = await request('/processing/optimize', {
        image_url: uploadedUrl,
        mode: 'enhance'
      }, 'POST')
      if (optRes && optRes.optimized_url) {
        sourceUrl = optRes.optimized_url
      }
    }

    // 3. 深度图
    const depthRes = await request('/processing/depth-map', {
      image_url: sourceUrl
    }, 'POST')
    const depthUrl = depthRes && depthRes.depth_url
    if (!depthUrl) {
      throw new Error('深度图生成失败')
    }

    // 4. BMP（输入 depth_url）
    const bmpRes = await request('/processing/bmp', {
      image_url: depthUrl
    }, 'POST')

    // 5. 2.5D 预览
    const podRes = await request('/processing/pod-3d', {
      source_url: depthUrl,
      depth_scale: 1.2,
      perspective_angle: 45,
      smooth_radius: 5,
      output_channels: 32
    }, 'POST')

    // 6. Z 轴 G 代码 + STL + 设备参数
    const zRes = await request('/processing/z-axis-25d', {
      depth_map_url: depthUrl,
      max_depth_mm: 1.2,
      scan_step_mm: 0.2,
      pixel_step: 2,
      stl_pixel_step: 4
    }, 'POST')

    const result = {
      depth_url: normalizeUrl(depthUrl),
      pod3d_url: normalizeUrl(podRes && podRes.output_url),
      bmp_url: normalizeUrl(bmpRes && bmpRes.bmp_url),
      z_gcode_url: normalizeUrl(zRes && zRes.z_gcode_url),
      stl_url: normalizeUrl(zRes && zRes.stl_url),
      profile_url: normalizeUrl(zRes && zRes.machine_profile_url),
      risk_score: null,
      grade: null,
      material: material,
      sizeText: sizeText,
      optimize: optimize
    }

    return {
      isError: false,
      content: [{
        type: 'text',
        text: '已为您的照片生成2.5D内雕加工包（灰度图+BMP+2.5D预览+Z轴G代码+STL）。点击卡片进入小程序复核并提交打样。'
      }],
      structuredContent: result,
      handoff: (data) => ({
        query: 'from=ai&mode=photo',
        payload: data || result
      }),
      _meta: {
        ui: {
          componentPath: 'components/engrave-card/index',
          pagePath: '/pages/image25d/index'
        }
      }
    }
  } catch (e) {
    const reason = (e && e.message) || '服务繁忙'
    return {
      isError: true,
      content: [{
        type: 'text',
        text: '生成失败：' + reason + '。请确认图片为png/jpg且不超过10M后重试，或稍后再试。'
      }]
    }
  }
}
