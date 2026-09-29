// 彩印风格图不依赖激光深度服务；成品预览在已有页面继续确认。
const { request, uploadFile, normalizeUrl } = require('./_request')

const TEMPLATES = ['summer', 'red', 'blue', 'gold', 'white']

module.exports = async function makeAIStylePhoto(args) {
  args = args || {}
  const imagePath = args.imagePath
  const template = args.template || 'summer'

  try {
    if (!imagePath) {
      throw new Error('请先上传一张照片')
    }
    if (TEMPLATES.indexOf(template) === -1) {
      throw new Error('模板参数不合法')
    }

    // 1. 上传图片
    const uploadedUrl = await uploadFile(imagePath)

    // 与页面共用照片任务，保留后续成品预览和询价需要的任务编号。
    const job = await request('/photo-jobs', {
      source_image_url: uploadedUrl,
      template
    }, 'POST')
    if (!job || !Number.isSafeInteger(job.id) || job.id <= 0) throw new Error('未能创建照片任务')
    const optRes = await request('/photo-jobs/' + job.id + '/style', {}, 'POST')
    if (!optRes || optRes.id !== job.id || optRes.status !== 'optimized') throw new Error('照片任务尚未完成')
    const styledUrl = optRes.optimized_image_url

    if (typeof styledUrl !== 'string' || !styledUrl.trim()) {
      throw new Error('生成服务未返回有效图片，请稍后重试')
    }

    const result = {
      styled_url: normalizeUrl(styledUrl),
      mode: 'booth',
      template,
      photo_job_id: job.id,
      photo_job_status: optRes.status,
      production_status: optRes.production_status || 'not_requested',
      is_generative_cartoon: optRes.runtime && optRes.runtime.is_generative_cartoon === true,
      generation_source: optRes.runtime && optRes.runtime.source || 'unknown'
    }

    return {
      isError: false,
      content: [{
        type: 'text',
        text: (result.is_generative_cartoon ? '已生成卡通风格图。' : '已生成处理预览，本次未确认完成生成式卡通。') + '请进入小程序选择成品、检查合成预览并确认设计；尚未付款或提交打印。'
      }],
      structuredContent: result,
      handoff: (data) => ({
        query: 'from=ai&mode=booth',
        payload: data || result
      }),
      _meta: {
        ui: {
          componentPath: 'components/engrave-card/index',
          pagePath: '/pages/photobooth/index'
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
