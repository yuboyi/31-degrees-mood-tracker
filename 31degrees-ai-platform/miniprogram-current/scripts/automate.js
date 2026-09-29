/**
 * 小程序自动化控制脚本
 * 负责：启动 IDE auto 模式 → 连接 WebSocket → 截图/导航/测试
 *
 * 用法：
 *   node scripts/automate.js start    # 启动 IDE auto 模式
 *   node scripts/automate.js shot     # 截图所有页面
 *   node scripts/automate.js deploy   # 完整部署流程（构建+预览+上传）
 */

const cp = require('child_process')
const path = require('path')
const fs = require('fs')

const CONFIG = {
  ideCli: 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
  projectPath: path.resolve(__dirname, '../dist/build/mp-weixin'),
  autoPort: 9426,       // automation WebSocket port
  httpPort: 11522,      // IDE HTTP port (auto-assigned)
  appid: 'wxd985d7e0107abc6a',
}

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`) }

// 用 PowerShell 执行 IDE CLI（Windows cmd 编码问题太多）
function ideCmd(args) {
  const psScript = `& '${CONFIG.ideCli}' ${args}`
  const r = cp.spawnSync('powershell', ['-Command', psScript], {
    encoding: 'utf8',
    timeout: 30000
  })
  return (r.stdout || '') + (r.stderr || '')
}

async function startIDE() {
  // 先退出旧的
  log('Quitting old IDE...')
  ideCmd('quit')
  await new Promise(r => setTimeout(r, 3000))

  // 启动 auto 模式
  log('Starting IDE with auto mode...')
  const out = ideCmd(`auto --project '${CONFIG.projectPath}' --auto-port ${CONFIG.autoPort}`)
  log(out.trim().split('\n').filter(l => l.startsWith('✔') || l.startsWith('✖')).join('\n'))

  if (!out.includes('✔ auto')) {
    throw new Error('Auto mode failed to start')
  }
  log('IDE auto mode ready!')
}

async function connect() {
  const automator = require('miniprogram-automator')
  const maxRetries = 10
  for (let i = 0; i < maxRetries; i++) {
    try {
      const mp = await automator.launcher.connectTool({
        wsEndpoint: `ws://127.0.0.1:${CONFIG.autoPort}`
      })
      log('Connected to mini program!')
      return mp
    } catch (e) {
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 3000))
      } else {
        throw e
      }
    }
  }
}

async function takeScreenshots() {
  const mp = await connect()
  fs.mkdirSync(path.resolve(__dirname, '../screenshots'), { recursive: true })

  const pages = [
    { name: 'home',    action: async () => { await mp.switchTab('/pages/index/index'); await new Promise(r => setTimeout(r, 2000)) } },
    { name: 'my',      action: async () => { await mp.switchTab('/pages/my/my'); await new Promise(r => setTimeout(r, 2000)) } },
    { name: 'store',   action: async () => { await mp.switchTab('/pages/store/index'); await new Promise(r => setTimeout(r, 2000)) } },
  ]

  for (const p of pages) {
    await p.action()
    const page = await mp.currentPage()
    const filepath = path.resolve(__dirname, `../screenshots/${p.name}.png`)
    await mp.screenshot({ path: filepath })
    log(`Screenshot: ${p.name} (${page.path})`)
  }
}

// HTTP API 部署
function buildProject() {
  log('Building...')
  cp.execSync('npm run build:mp-weixin', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })
  log('Build done')
  // 拷贝模板图片
  const srcDir = path.resolve(__dirname, '../src/static/templates')
  const dstDir = path.resolve(CONFIG.projectPath, 'static/templates')
  if (fs.existsSync(srcDir)) {
    fs.mkdirSync(dstDir, { recursive: true })
    fs.readdirSync(srcDir).filter(f => f.endsWith('.png')).forEach(f => {
      fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f))
    })
  }
}

// ========== 主流程 ==========
async function main() {
  const cmd = process.argv[2] || 'shot'

  if (cmd === 'start') {
    await startIDE()
  } else if (cmd === 'shot') {
    await startIDE()
    await takeScreenshots()
  } else if (cmd === 'deploy') {
    // One deployment path prevents uploading a stale build from another drive.
    cp.execFileSync(process.execPath, [path.resolve(__dirname, 'deploy.js'), 'upload'], {
      cwd: path.resolve(__dirname, '..'), stdio: 'inherit', windowsHide: true,
    })
  }

  log('Done!')
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
