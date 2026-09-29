/**
 * 激光照片定制 — 自动化部署脚本
 *
 * 使用微信开发者工具 HTTP API 完成：构建 → 预览 → 上传
 * 不依赖 miniprogram-ci，不需要 IP 白名单！
 *
 * 使用方式：
 *   node scripts/deploy.js preview    # 构建 + 预览（生成二维码）
 *   node scripts/deploy.js upload     # 构建 + 预览 + 上传
 *   node scripts/deploy.js build      # 仅构建
 *
 * 前置条件：
 *   1. 微信开发者工具已安装
 *   2. 开发者工具中已登录微信账号
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const http = require('http')

// ========== 配置 ==========
const CONFIG = {
  appid: 'wxd985d7e0107abc6a',
  projectPath: path.resolve(__dirname, '../dist/build/mp-weixin'),
  ideCli: 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
  idePort: 9420,
  ideHost: '127.0.0.1'
}

// ========== 工具 ==========
function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

function logError(msg) {
  console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`)
}

function logSuccess(msg) {
  console.log(`\x1b[32m[OK]\x1b[0m ${msg}`)
}

function getVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')).version || '0.1.0'
  } catch { return '0.1.0' }
}

// ========== IDE 管理 ==========
function ideCmd(args) {
  const cmd = `cmd /c ""${CONFIG.ideCli}" ${args}"`
  try {
    return execSync(cmd, { timeout: 30000, encoding: 'utf8', windowsHide: true })
  } catch (e) {
    return (e.stderr || '') + (e.stdout || '') + e.message
  }
}

function startIDE() {
  log('启动微信开发者工具...')
  const out = ideCmd(`open --project "${CONFIG.projectPath}" --port ${CONFIG.idePort}`)
  log(out.trim().split('\n').filter(l => l.trim() && !l.includes('initialize')).join('\n'))
  return true
}

function quitIDE() {
  log('关闭开发者工具...')
  ideCmd('quit')
}

// ========== HTTP API ==========
function apiGet(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    const url = `http://${CONFIG.ideHost}:${CONFIG.idePort}${endpoint}?${qs}`

    http.get(url, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        const ct = res.headers['content-type'] || ''
        if (ct.includes('json') || ct.includes('text')) {
          try { resolve(JSON.parse(buf.toString('utf-8'))) }
          catch { resolve(buf.toString('utf-8')) }
        } else {
          resolve(buf) // 二进制（图片等）
        }
      })
    }).on('error', reject)
  })
}

// ========== 构建 ==========
function buildProject() {
  log('开始构建 uni-app 项目...')
  try {
    execSync('npm run build:mp-weixin', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    })
    logSuccess('构建完成')

    // 拷贝模板图片
    const srcDir = path.resolve(__dirname, '../src/static/templates')
    const dstDir = path.resolve(CONFIG.projectPath, 'static/templates')
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true })
      fs.readdirSync(srcDir).filter(f => f.endsWith('.png')).forEach(f => {
        fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f))
      })
    }
    return true
  } catch (e) {
    logError(`构建失败: ${e.message}`)
    return false
  }
}

// ========== 预览 ==========
async function doPreview() {
  log('生成预览二维码...')
  startIDE()

  // 等待 IDE 就绪
  await new Promise(r => setTimeout(r, 3000))

  const result = await apiGet('/v2/preview', {
    project: CONFIG.projectPath,
    appid: CONFIG.appid
  })

  if (Buffer.isBuffer(result)) {
    const qrcodePath = path.resolve(__dirname, '../preview-qrcode.jpg')
    fs.writeFileSync(qrcodePath, result)
    logSuccess(`预览二维码已生成: ${qrcodePath}`)
    logSuccess('请用微信扫描二维码体验开发版')
  } else {
    throw new Error('预览失败，未获得二维码图片')
  }
}

// ========== 上传 ==========
async function doUpload() {
  log('上传代码到微信后台...')
  startIDE()
  await new Promise(r => setTimeout(r, 3000))

  const version = getVersion()
  const desc = process.env.UPLOAD_DESC || `CI 自动上传 ${new Date().toLocaleString('zh-CN')}`

  const result = await apiGet('/v2/upload', {
    project: CONFIG.projectPath,
    appid: CONFIG.appid,
    version,
    desc
  })

  if (result && result.success) {
    const size = result.info?.size?.total || 0
    logSuccess(`上传成功! 版本: ${version}  大小: ${(size / 1024).toFixed(0)}KB`)
    logSuccess(`备注: ${desc}`)
    logSuccess('前往微信公众平台 → 版本管理 查看开发版')
  } else {
    throw new Error('上传失败，开发者工具未确认成功')
  }
}

// ========== 主流程 ==========
async function main() {
  const cmd = (process.argv[2] || 'preview').toLowerCase()
  if (!['preview', 'upload', 'build'].includes(cmd)) throw new Error('未知部署命令')
  if (cmd === 'upload') require('./check-ui-baseline.cjs').requireUiBaseline()
  if (cmd !== 'build') {
    const { requireBackendContract } = await import('./check-backend-contract.mjs')
    await requireBackendContract()
  }

  console.log('')
  console.log('  ╔════════════════════════════════╗')
  console.log('  ║   激光照片定制 · 部署工具     ║')
  console.log('  ╚════════════════════════════════╝')
  console.log(`  AppID: ${CONFIG.appid}`)
  console.log(`  模式:  ${cmd}`)
  console.log('')

  // 构建
  if (!buildProject()) process.exit(1)

  if (cmd === 'preview') {
    await doPreview()
  } else if (cmd === 'upload') {
    require('./check-ui-baseline.cjs').requireUiBaseline()
    await doPreview()
    await doUpload()
  } else if (cmd === 'build') {
    logSuccess('仅构建完成')
  } else {
    logError(`未知命令: ${cmd}。可用: build | preview | upload`)
    process.exit(1)
  }

  logSuccess('全流程完成')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
