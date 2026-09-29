// 原子接口：makeAICommemorativeCoin —— AI 纪念币（环绕文字 + 金银材质加工包）
// 流程：upload → coin-package
const { request, uploadFile, normalizeUrl } = require('./_request')

const MATERIALS = ['gold', 'silver']

module.exports = async function makeAICommemorativeCoin(args) {
  args = args || {}
  const imagePath = args.imagePath
  const ringTextTop = args.ringTextTop || '清凉夏日'
  const ringTextBottom = args.ringTextBottom || '31度科技·2026'
  const material = args.material || 'gold'
  const sizeMm = args.sizeMm || 60

  try {
    if (!imagePath) {
      throw new Error('请先上传一张照片')
    }
    if (MATERIALS.indexOf(material) === -1) {
      throw new Error('材质参数不合法')
    }
    const sizeNum = Number(sizeMm)
    if (!(sizeNum >= 40 && sizeNum <= 80)) {
      throw new Error('纪念币直径需在40-80mm之间')
    }

    // 1. 上传图片
    const uploadedUrl = await uploadFile(imagePath)

    // 2. 生成纪念币加工包
    const res = await request('/processing/coin-package', {
      image_url: uploadedUrl,
      coin_size_mm: sizeNum,
      template: material,
      ring_text_top: ringTextTop,
      ring_text_bottom: ringTextBottom
    }, 'POST')

    const result = {
      coin_url: normalizeUrl(res && res.coin_url),
      depth_url: normalizeUrl(res && res.depth_url),
      bmp_url: normalizeUrl(res && res.bmp_url),
      stl_url: normalizeUrl(res && res.stl_url),
      profile_url: normalizeUrl(res && res.machine_profile_url),
      coin_size_mm: sizeNum,
      material: material,
      ringTextTop: ringTextTop,
      ringTextBottom: ringTextBottom
    }

    return {
      isError: false,
      content: [{
        type: 'text',
        text: '已为您生成AI纪念币（圆形币面+环绕文字+灰度图/BMP/STL加工包）。点击卡片进入小程序查看并提交打样。'
      }],
      structuredContent: result,
      handoff: (data) => ({
        query: 'from=ai&mode=coin',
        payload: data || result
      }),
      _meta: {
        ui: {
          componentPath: 'components/coin-card/index',
          pagePath: '/pages/coin/index'
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
