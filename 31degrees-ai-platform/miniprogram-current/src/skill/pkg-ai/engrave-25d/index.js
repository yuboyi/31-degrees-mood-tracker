// 31度2.5D内雕定制技能（engrave-25d）入口
// 注册 5 个原子接口，name 与 mcp.json 中 apis[].name 严格一致。

const skill = wx.modelContext.createSkill('/pkg-ai/engrave-25d')

const { ensureLogin } = require('./apis/_request')
const startPhotoEngraving = require('./apis/startPhotoEngraving')
const generateTextTo25D = require('./apis/generateTextTo25D')
const makeAIStylePhoto = require('./apis/makeAIStylePhoto')
const makeAICommemorativeCoin = require('./apis/makeAICommemorativeCoin')
const queryEngravingStatus = require('./apis/queryEngravingStatus')

// 统一登录中间件：在每次原子接口执行前确保登录态
skill.use(async (ctx, next) => {
  try {
    await ensureLogin()
  } catch (e) {
    // 登录失败不阻断：接口内部 request() 会再次尝试并返回中文错误
  }
  if (typeof next === 'function') {
    await next()
  }
})

skill.registerAPI('startPhotoEngraving', startPhotoEngraving)
skill.registerAPI('generateTextTo25D', generateTextTo25D)
skill.registerAPI('makeAIStylePhoto', makeAIStylePhoto)
skill.registerAPI('makeAICommemorativeCoin', makeAICommemorativeCoin)
skill.registerAPI('queryEngravingStatus', queryEngravingStatus)
