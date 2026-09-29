/**
 * 31du SKILL 原子接口 Node 验收台
 * mock wx.* 框架层，真实调用本地后端 http://127.0.0.1:8000/api
 * 运行：node scripts/test-skill-node.js
 */
const fs = require('fs')
const path = require('path')

const API_BASE = 'http://127.0.0.1:8000/api'
const SAMPLE_IMG = 'E:\\Jieyue_AI_Codex_Client\\source_images\\2026年5月10日 14_53_59 (10).png'
const SKILL_DIR = path.resolve(__dirname, '..', 'src', 'skill', 'pkg-ai', 'engrave-25d')

// ---- wx mock ----
const storage = { api_base_url: API_BASE, token: '' }
const registered = {}

function readFileB64(p) {
  const buf = fs.readFileSync(p)
  return Buffer.from(buf).toString('base64')
}

async function wxRequest({ url, method = 'GET', data = {}, header = {}, timeout = 120000 }) {
  const full = url.startsWith('http') ? url : API_BASE + url
  const headers = { 'Content-Type': 'application/json', ...header }
  const body = method === 'GET' ? undefined : JSON.stringify(data)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(full, { method, headers, body, signal: controller.signal })
    let json = null
    try { json = await res.json() } catch { /* ignore */ }
    return { statusCode: res.status, data: json !== null ? json : await res.text() }
  } finally {
    clearTimeout(timer)
  }
}

async function wxUploadFile({ url, filePath, name, header = {}, timeout = 120000 }) {
  const full = url.startsWith('http') ? url : API_BASE + url
  const form = new FormData()
  const buf = fs.readFileSync(filePath)
  form.append(name, new Blob([buf]), path.basename(filePath))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(full, { method: 'POST', headers: header, body: form, signal: controller.signal })
    let json = null
    try { json = await res.json() } catch { /* ignore */ }
    return { statusCode: res.status, data: json !== null ? json : await res.text() }
  } finally {
    clearTimeout(timer)
  }
}

function wxLogin() {
  return Promise.resolve({ code: 'node-test-' + Date.now() })
}

const wx = {
  getStorageSync: (k) => storage[k],
  setStorageSync: (k, v) => { storage[k] = v },
  login: (opt) => {
    const p = Promise.resolve({ code: 'node-test-' + Date.now() })
    if (opt && (opt.success || opt.fail || opt.complete)) {
      p.then(
        (r) => { if (opt.success) opt.success(r); if (opt.complete) opt.complete(r) },
        (e) => {
          const err = { errMsg: String(e) }
          if (opt.fail) opt.fail(err)
          if (opt.complete) opt.complete(err)
        },
      )
      return undefined
    }
    return p
  },
  request: (opt) => {
    const p = wxRequest(opt)
    if (typeof opt.success === 'function' || typeof opt.fail === 'function' || typeof opt.complete === 'function') {
      p.then(
        (res) => { if (opt.success) opt.success(res); if (opt.complete) opt.complete(res) },
        (err) => {
          const e = { errMsg: String(err && err.message ? err.message : err) }
          if (opt.fail) opt.fail(e)
          if (opt.complete) opt.complete(e)
        },
      )
      return undefined
    }
    return p
  },
  uploadFile: (opt) => {
    const p = wxUploadFile(opt)
    if (typeof opt.success === 'function' || typeof opt.fail === 'function' || typeof opt.complete === 'function') {
      p.then(
        (res) => { if (opt.success) opt.success(res); if (opt.complete) opt.complete(res) },
        (err) => {
          const e = { errMsg: String(err && err.message ? err.message : err) }
          if (opt.fail) opt.fail(e)
          if (opt.complete) opt.complete(e)
        },
      )
      return undefined
    }
    return p
  },
  getImageInfo: () => Promise.resolve({ width: 512, height: 512 }),
  modelContext: {
    createSkill(skillPath) {
      return {
        skillPath,
        middlewares: [],
        use(mw) { this.middlewares.push(mw) },
        registerAPI(name, handler) { registered[name] = handler },
      }
    },
    getSessionId: () => 'node-test-session',
    expireAllCards: async () => ({ errMsg: 'ok' }),
    getContext: () => ({
      on() {},
      sendFollowUpMessage: async () => ({ errMsg: 'ok' }),
      reapplyApiCall: async () => ({}),
    }),
    getViewContext: () => ({
      getDimensions: () => ({ minHeight: 100, maxHeight: 400, width: 300 }),
      on() {},
      setRelatedPage: () => {},
      updateModelContext: async () => ({ errMsg: 'ok' }),
      openDetailPage: () => {},
      preloadDetailPage: () => {},
      expirePreviousCards: async () => ({ errMsg: 'ok' }),
    }),
    NotificationType: { Input: 'input', Result: 'result', Overflow: 'overflow', Expire: 'expire' },
  },
}

global.wx = wx

// ---- load skill ----
require(path.join(SKILL_DIR, 'index.js'))
console.log('registered APIs:', Object.keys(registered).join(', '))

async function runCase(name, args) {
  console.log(`\n===== ${name} =====`)
  const t0 = Date.now()
  try {
    const res = await registered[name](args)
    const dt = ((Date.now() - t0) / 1000).toFixed(1)
    const contentText = Array.isArray(res.content) ? res.content.map((c) => c.text).join(' | ').slice(0, 120) : ''
    console.log(`isError=${res.isError}  (${dt}s)`)
    console.log('content:', contentText)
    if (res.structuredContent) {
      console.log('structuredContent keys:', Object.keys(res.structuredContent).join(','))
      console.log('sample urls:', JSON.stringify(
        Object.fromEntries(Object.entries(res.structuredContent).filter(([k]) => k.endsWith('_url'))),
      ).slice(0, 300))
    }
    console.log('handoff:', typeof res.handoff === 'function' ? 'function ✓' : 'MISSING')
    if (typeof res.handoff === 'function') {
      const h = res.handoff({ result: res })
      console.log('handoff() ->', JSON.stringify(h).slice(0, 160))
    }
    return res
  } catch (e) {
    console.log('THROW:', e && e.message ? e.message : String(e))
    return null
  }
}

;(async () => {
  await runCase('queryEngravingStatus', {})
  await runCase('generateTextTo25D', { prompt: '一只坐在星空下的小猫，可爱卡通风格', style: 'crystal' })
  await runCase('makeAICommemorativeCoin', {
    imagePath: SAMPLE_IMG, ringTextTop: '清凉夏日', ringTextBottom: '31度科技·2026', material: 'gold', sizeMm: 60,
  })
  await runCase('makeAIStylePhoto', { imagePath: SAMPLE_IMG, template: 'summer' })
  await runCase('startPhotoEngraving', { imagePath: SAMPLE_IMG, material: '水晶', sizeText: '80x80x80mm', optimize: true })
  console.log('\n===== ALL-CASES-DONE =====')
})().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
