// 原子接口：generateTextTo25D —— 文生 2.5D（描述 → 2D 图 → 深度图 → 2.5D 预览）
const { request, normalizeUrl } = require('./_request')

const STYLES = ['crystal', 'portrait', 'product', 'logo']

module.exports = async function generateTextTo25D(args) {
  args = args || {}
  const prompt = args.prompt
  const style = args.style || 'crystal'

  try {
    if (!prompt) {
      throw new Error('请先提供一段文字描述')
    }
    if (typeof prompt === 'string' && prompt.length > 200) {
      throw new Error('文字描述请控制在200字以内')
    }
    if (STYLES.indexOf(style) === -1) {
      throw new Error('风格参数不合法')
    }

    const res = await request('/processing/text-to-25d', {
      prompt: prompt,
      style: style,
      width: 512,
      height: 512,
      steps: 2
    }, 'POST')

    const result = {
      image_url: normalizeUrl(res && res.image_url),
      depth_url: normalizeUrl(res && res.depth_url),
      pod3d_url: normalizeUrl(res && res.pod3d_url),
      prompt: prompt,
      style: style
    }

    return {
      isError: false,
      content: [{
        type: 'text',
        text: '已根据您的描述生成文生2.5D方案（2D图+深度图+2.5D预览）。点击卡片进入小程序复核并提交打样。'
      }],
      structuredContent: result,
      handoff: (data) => ({
        query: 'from=ai&mode=text',
        payload: data || result
      }),
      _meta: {
        ui: {
          componentPath: 'components/engrave-card/index',
          pagePath: '/pages/text25d/index'
        }
      }
    }
  } catch (e) {
    const reason = (e && e.message) || '服务繁忙'
    return {
      isError: true,
      content: [{
        type: 'text',
        text: '生成失败：' + reason + '。请换个描述后重试，或稍后再试。'
      }]
    }
  }
}
