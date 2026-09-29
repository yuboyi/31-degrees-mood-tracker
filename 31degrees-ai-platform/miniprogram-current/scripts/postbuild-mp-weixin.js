const fs = require('fs')
const path = require('path')

const distDir = path.resolve(__dirname, '..', 'dist', 'build', 'mp-weixin')
const projectConfigPath = path.join(distDir, 'project.config.json')
const appJsonPath = path.join(distDir, 'app.json')
const appWxssPath = path.join(distDir, 'app.wxss')

function ensureProjectConfig() {
  if (!fs.existsSync(projectConfigPath)) return
  const config = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'))
  config.libVersion = '3.15.2'
  config.appid = config.appid || 'wxd985d7e0107abc6a'
  config.projectname = '31度'
  config.condition = {
    ...(config.condition || {}),
    miniprogram: {
      current: 0,
      list: [
        {
          id: 0,
          name: '31度首页',
          pathName: 'pages/index/index',
          query: '',
          scene: null,
        },
        {
          id: 1,
          name: 'AI工艺预检',
          pathName: 'pages/image25d/index',
          query: '',
          scene: null,
        },
        {
          id: 2,
          name: '提交打样复核',
          pathName: 'pages/sample/submit',
          query: '',
          scene: null,
        },
      ],
    },
  }
  fs.writeFileSync(projectConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

function normalizeWxss() {
  if (!fs.existsSync(appWxssPath)) return
  const source = fs.readFileSync(appWxssPath, 'utf8')
  const cleaned = source
    .replace(/page\{--status-bar-height:[^}]+}\[data-c-h="true"]\{display:\s*none\s*!important;}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimStart()
  fs.writeFileSync(appWxssPath, cleaned, 'utf8')
}

function ensureAppJsonDefaults() {
  if (!fs.existsSync(appJsonPath)) return
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
  appJson.subPackages = appJson.subPackages || []
  appJson.preloadRule = appJson.preloadRule || {}
  appJson.plugins = appJson.plugins || {}
  if (appJson.workers === '') delete appJson.workers
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`, 'utf8')
}

/**
 * 注入微信AI SKILL 分包与 agent 声明（小程序 AI 开发模式）。
 * 源目录: src/skill/pkg-ai  -> 构建产物: dist/build/mp-weixin/pkg-ai
 */
function injectAgentSkill() {
  const srcSkillDir = path.resolve(__dirname, '..', 'src', 'skill', 'pkg-ai')
  const dstSkillDir = path.join(distDir, 'pkg-ai')
  if (!fs.existsSync(srcSkillDir)) {
    console.warn('[postbuild] skill source missing, skip agent injection:', srcSkillDir)
    return
  }
  fs.cpSync(srcSkillDir, dstSkillDir, { recursive: true })

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
  appJson.lazyCodeLoading = 'requiredComponents'
  const subPackages = appJson.subPackages || []
  if (!subPackages.some((pkg) => pkg.root === 'pkg-ai')) {
    subPackages.push({ root: 'pkg-ai', independent: true, pages: [] })
  }
  appJson.subPackages = subPackages
  appJson.agent = {
    instruction: 'pkg-ai/engrave-25d/AGENTS.md',
    pageMetadata: 'pkg-ai/page-meta.json',
    skills: [
      {
        name: 'engrave25d',
        description: '31度2.5D内雕定制：照片转2.5D加工包、文生2.5D、AI拍照机风格大片、AI纪念币制作与订单进度查询',
        path: 'pkg-ai/engrave-25d',
      },
    ],
  }
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`, 'utf8')
  console.log('[postbuild] agent SKILL injected:', appJson.agent.skills.map((s) => s.name).join(','))
}

ensureProjectConfig()
ensureAppJsonDefaults()
injectAgentSkill()
normalizeWxss()
