/**
 * 小程序自动化截图 — 使用 PowerShell 启动 IDE，Node 连接
 */
const cp = require('child_process')
const path = require('path')

async function main() {
  // 1. 用 PowerShell 确保 auto 模式运行
  console.log('[1] Enabling auto mode via PowerShell...')
  const psResult = cp.spawnSync('powershell', [
    '-Command',
    `& 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat' auto --project 'F:\\阶跃 AI 客户端\\mini-program\\dist\\build\\mp-weixin' --port 9420`
  ], { encoding: 'utf8', timeout: 20000 })
  console.log(psResult.stdout?.trim())
  if (psResult.stderr) console.log('PS stderr:', psResult.stderr.trim())

  // 2. 等待 WebSocket 就绪
  console.log('[2] Waiting for WebSocket...')
  await new Promise(r => setTimeout(r, 5000))

  // 3. 连接到 mini program
  const automator = require('miniprogram-automator')
  console.log('[3] Connecting...')
  const mp = await automator.launcher.connectTool({ wsEndpoint: 'ws://127.0.0.1:9420' })
  console.log('[3] Connected!')

  // 4. 首页截图
  const page = await mp.currentPage()
  console.log('[4] Current page:', page.path)
  await mp.screenshot({ path: path.resolve(__dirname, '../screenshot-home.png') })
  console.log('[4] Screenshot saved: screenshot-home.png')

  // 5. 切到我的页面
  await mp.switchTab('/pages/my/my')
  await new Promise(r => setTimeout(r, 2000))
  const page2 = await mp.currentPage()
  console.log('[5] Switched to:', page2.path)
  await mp.screenshot({ path: path.resolve(__dirname, '../screenshot-my.png') })
  console.log('[5] Screenshot saved: screenshot-my.png')

  // 6. 切到门店页面
  await mp.switchTab('/pages/store/index')
  await new Promise(r => setTimeout(r, 2000))
  await mp.screenshot({ path: path.resolve(__dirname, '../screenshot-store.png') })
  console.log('[6] Screenshot saved: screenshot-store.png')
}

main().catch(e => {
  console.error('Error:', e.message, e.stack?.split('\n').slice(0,3).join('\n'))
  process.exit(1)
})
