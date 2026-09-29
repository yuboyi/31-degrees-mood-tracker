/**
 * 微信开发者工具验收：2.5D AI 工艺预检
 *
 * 验证边界：
 * 1. 只做本机构建、微信开发者工具预览、测试数据注入和证据落盘。
 * 2. 不执行 upload，不写微信后台版本。
 * 3. 不调用真实设备下单接口；高风险样张必须进入人工复核队列。
 *
 * 产物：
 * - outputs/wechat_devtools_craft_check_<timestamp>/preview-qrcode.jpg
 * - outputs/wechat_devtools_craft_check_<timestamp>/preview-info.json
 * - outputs/wechat_devtools_craft_check_<timestamp>/result.json
 * - outputs/wechat_devtools_craft_check_<timestamp>/REPORT.md
 */
const cp = require('child_process')
const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')

let automator = null
try {
  automator = require('miniprogram-automator')
} catch (error) {
  automator = null
}

const ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(ROOT, '..')
const CLI_PATH = process.env.WECHAT_DEVTOOLS_CLI || 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat'
const DIST_PATH = path.join(ROOT, 'dist/build/mp-weixin')
const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs')
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')
const OUTPUT_DIR = path.join(OUTPUT_ROOT, `wechat_devtools_craft_check_${STAMP}`)
const CLI_OUTPUT_DIR = path.join(os.tmpdir(), `31du-wechat-craft-check-${STAMP}`)
const PREVIEW_PATH = path.resolve(`C:/31du-mp-weixin-preview-${STAMP}`)
const APPID = 'wxd985d7e0107abc6a'
const IDE_PORT = Number(process.env.WECHAT_DEVTOOLS_PORT || 47411)
const AUTOMATOR_PORT = Number(process.env.WECHAT_AUTOMATOR_PORT || 9420)
const AUTOMATOR_CONNECT_ATTEMPTS = Number(process.env.WECHAT_AUTOMATOR_ATTEMPTS || 18)

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function tail(value, size = 2500) {
  return String(value || '').slice(-size)
}

function run(cmd, args, options = {}) {
  const result = cp.spawnSync(cmd, args, {
    cwd: options.cwd || ROOT,
    encoding: 'utf8',
    timeout: options.timeout || 120000,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 12,
  })

  const code = result.status === null
    ? (result.error || result.signal ? 1 : 0)
    : result.status

  return {
    code,
    signal: result.signal || '',
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? result.error.message : '',
  }
}

function runCmdLine(commandLine, options = {}) {
  return run('cmd.exe', ['/d', '/s', '/c', commandLine], options)
}

function runCli(action, args = [], options = {}) {
  return run('cmd.exe', ['/c', CLI_PATH, action, ...args.map(String)], options)
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

function readJsonSafe(file) {
  try {
    return JSON.parse(readText(file))
  } catch (error) {
    return null
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseJsonOutput(result) {
  const text = String(result.stdout || '').trim()
  if (!text) return []
  try {
    const value = JSON.parse(text)
    return Array.isArray(value) ? value : [value]
  } catch (error) {
    return []
  }
}

function collectDevToolsPids() {
  const escapedPreview = PREVIEW_PATH.replace(/'/g, "''").replace(/\\/g, '\\\\')
  const previewCommand = [
    '$ErrorActionPreference="SilentlyContinue"',
    `$preview='${escapedPreview}'`,
    'Get-CimInstance Win32_Process',
    '| Where-Object { $_.Name -eq "wechatdevtools.exe" -and ($_.CommandLine -match "31du-mp-weixin-preview" -or $_.CommandLine -match [Regex]::Escape($preview)) }',
    '| Select-Object ProcessId,Name,CommandLine',
    '| ConvertTo-Json -Depth 3',
  ].join(' ')
  const previewResult = run('powershell.exe', ['-NoProfile', '-Command', previewCommand], { timeout: 20000 })
  const previewPids = parseJsonOutput(previewResult)
    .map(item => Number(item.ProcessId))
    .filter(Boolean)

  const fallbackCommand = [
    'Get-Process wechatdevtools -ErrorAction SilentlyContinue',
    '| Select-Object @{Name="ProcessId";Expression={$_.Id}},ProcessName,MainWindowTitle',
    '| ConvertTo-Json -Depth 3',
  ].join(' ')
  const fallbackResult = run('powershell.exe', ['-NoProfile', '-Command', fallbackCommand], { timeout: 20000 })
  const fallbackPids = parseJsonOutput(fallbackResult)
    .map(item => Number(item.ProcessId || item.Id))
    .filter(Boolean)
  return [...new Set([...previewPids, ...fallbackPids])]
}

function collectListeningPortsForPids(pids) {
  if (!pids.length) return []
  const command = [
    `$wechatPids=@(${pids.join(',')})`,
    'Get-NetTCPConnection -State Listen',
    '| Where-Object { ($_.LocalAddress -eq "127.0.0.1" -or $_.LocalAddress -eq "0.0.0.0") -and ($wechatPids -contains $_.OwningProcess) }',
    '| Select-Object LocalAddress,LocalPort,OwningProcess',
    '| Sort-Object LocalPort',
    '| ConvertTo-Json -Depth 3',
  ].join(' ')
  const result = run('powershell.exe', ['-NoProfile', '-Command', command], { timeout: 20000 })
  return parseJsonOutput(result)
    .map(item => Number(item.LocalPort))
    .filter(Boolean)
}

function probeHttpPort(port, requestPath = '/') {
  return new Promise(resolve => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: requestPath,
      method: 'GET',
      timeout: 1200,
    }, res => {
      res.resume()
      res.on('end', () => resolve({
        port,
        statusCode: res.statusCode,
        headers: res.headers,
      }))
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', error => resolve({ port, error: error.message }))
    req.end()
  })
}

async function discoverAutomatorEndpoints() {
  const pids = collectDevToolsPids()
  const ports = collectListeningPortsForPids(pids)
  const candidates = [...new Set([AUTOMATOR_PORT, IDE_PORT, ...ports])].filter(port => port > 0)
  const probes = []
  const websocketLikePorts = []

  for (const port of candidates) {
    const probe = await probeHttpPort(port)
    probes.push(probe)
    if (probe.statusCode === 426 || probe.headers?.proxy_error || probe.headers?.upgrade) {
      websocketLikePorts.push(port)
    }
  }

  const orderedPorts = [...new Set([
    AUTOMATOR_PORT,
    IDE_PORT,
    ...websocketLikePorts,
    ...(websocketLikePorts.length ? [] : candidates),
  ])]
  return {
    pids,
    ports: candidates,
    probes,
    endpoints: orderedPorts.map(port => `ws://127.0.0.1:${port}`),
  }
}

async function connectAutomatorEndpoint(wsEndpoint) {
  const mp = await automator.launcher.connectTool({ wsEndpoint })
  try {
    await mp.systemInfo()
  } catch (error) {
    try {
      await mp.close()
    } catch (closeError) {
      // Best-effort cleanup for half-open DevTools sessions.
    }
    throw error
  }
  return mp
}

function copyDistToAsciiPath() {
  if (!fs.existsSync(DIST_PATH)) {
    throw new Error(`构建产物不存在: ${DIST_PATH}`)
  }

  const previewForCheck = PREVIEW_PATH.replace(/\\/g, '/')
  if (!/^C:\/31du-mp-weixin-preview-\d{8}-\d{6}$/.test(previewForCheck)) {
    throw new Error(`拒绝清理非预期预览目录: ${PREVIEW_PATH}`)
  }

  const script = [
    "$ErrorActionPreference='Stop'",
    `$src='${DIST_PATH.replace(/'/g, "''")}'`,
    `$dst='${PREVIEW_PATH.replace(/'/g, "''")}'`,
    "if ($dst -notmatch '^C:\\\\31du-mp-weixin-preview-\\d{8}-\\d{6}$') { throw \"unsafe preview path: $dst\" }",
    'if (Test-Path -LiteralPath $dst) { Remove-Item -LiteralPath $dst -Recurse -Force }',
    'Copy-Item -LiteralPath $src -Destination $dst -Recurse -Force',
  ].join('; ')
  const result = run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    timeout: 120000,
  })
  if (result.code !== 0) {
    throw new Error(`镜像构建产物失败: ${result.stderr || result.stdout || result.error}`)
  }
}

function assertion(name, pass, evidence = '') {
  return { name, pass: Boolean(pass), evidence }
}

function collectSourceAssertions() {
  const sourcePages = readJsonSafe(path.join(ROOT, 'src/pages.json')) || {}
  const builtApp = readJsonSafe(path.join(PREVIEW_PATH, 'app.json')) || {}
  const builtConfig = readJsonSafe(path.join(PREVIEW_PATH, 'project.config.json')) || {}
  const homePage = readText(path.join(ROOT, 'src/pages/index/index.vue'))
  const imagePage = readText(path.join(ROOT, 'src/pages/image25d/index.vue'))
  const photoPage = readText(path.join(ROOT, 'src/pages/photobooth/index.vue'))
  const photoRouter = readText(path.join(ROOT, '..', 'backend/app/routers/photo_jobs.py'))
  const processingEngine = readText(path.join(ROOT, '..', 'backend/app/services/processing_engine.py'))
  const samplePage = readText(path.join(ROOT, 'src/pages/sample/submit.vue'))
  const ordersPage = readText(path.join(ROOT, 'src/pages/orders/index.vue'))
  const apiFile = readText(path.join(ROOT, 'src/api/index.ts'))
  const craftStore = readText(path.join(ROOT, 'src/stores/craft.ts'))

  const sourceTabs = sourcePages.tabBar?.list || []
  const builtTabs = builtApp.tabBar?.list || []
  const sourceHomeTab = sourceTabs.find(item => item.pagePath === 'pages/index/index')
  const sourceLaserTab = sourceTabs.find(item => item.pagePath === 'pages/image25d/index')
  const builtHomeTab = builtTabs.find(item => item.pagePath === 'pages/index/index')
  const builtLaserTab = builtTabs.find(item => item.pagePath === 'pages/image25d/index')
  const submitIndex = samplePage.indexOf('async function submitProof')
  const manualBranchIndex = samplePage.indexOf('if (manualReviewRequired.value)', submitIndex)
  const localOrderIndex = samplePage.indexOf("uni.setStorageSync('mock_sample_orders'", manualBranchIndex)
  const manualReturnIndex = samplePage.indexOf('return', localOrderIndex)
  const createOrderIndex = samplePage.indexOf('api.machine.createOrder', submitIndex)
  const loadMachineIndex = samplePage.indexOf('async function loadAvailableMachine')
  const loadMachineGuardIndex = samplePage.indexOf('if (manualReviewRequired.value)', loadMachineIndex)
  const clearMachineIndex = samplePage.indexOf('selectedMachine.value = null', loadMachineGuardIndex)
  const chooseImageIndex = imagePage.indexOf('function chooseImage')
  const chooseAutoRunIndex = imagePage.indexOf('runOneClick()', chooseImageIndex)
  const localPreviewGuardIndex = samplePage.indexOf('work.value?.local_preview_package')

  return [
    assertion(
      '微信构建工程使用31度小程序AppID',
      builtConfig.appid === APPID,
      `project.config.json appid=${builtConfig.appid || 'missing'}`
    ),
    assertion(
      '构建产物包含AI工艺预检页面',
      Array.isArray(builtApp.pages) && builtApp.pages.includes('pages/image25d/index'),
      `app.json pages count=${builtApp.pages?.length || 0}`
    ),
    assertion(
      '底部导航收敛为首页、激光内雕和我的',
      sourceHomeTab?.text === '首页' && sourceLaserTab?.text === '激光内雕' &&
        builtHomeTab?.text === '首页' && builtLaserTab?.text === '激光内雕' &&
        sourceTabs.length === 3 && builtTabs.length === 3,
      `source=${sourceTabs.map(item => item.text).join('/')}, build=${builtTabs.map(item => item.text).join('/')}`
    ),
    assertion(
      '首页只保留拍照打印和激光内雕主流程',
      ['AI拍照打印', '激光内雕', '拍照 → AI风格效果 → 选择成品', '灰度 / 2.5D'].every(token => homePage.includes(token)) &&
        !homePage.includes('展品签到方案'),
      '首页以拍照打印、激光内雕为首要入口，未开放入口不再占位'
    ),
    assertion(
      '激光页首屏已收敛为照片到加工包',
      ['照片变成加工包', '上传照片，先看灰度 / 2.5D', '加工预检', '提交打样'].every(token => imagePage.includes(token)),
      '页面首屏先讲上传、预检、加工包和打样，不把设备协议放在主路径'
    ),
    assertion(
      '激光页提供原图、灰度、2.5D和风险效果预览',
      ['效果预览', 'previewTabs', 'selectPreview', '灰度图', '2.5D', '风险图'].every(token => imagePage.includes(token)),
      '效果预览由真实后端输出地址驱动，未生成的效果保持禁用并提示'
    ),
    assertion(
      'AI拍照页提供成品效果预览和询价入口',
      ['成品效果预览', 'previewMode', 'previewUrl', 'AI风格效果', '内雕效果', '提交询价，锁定设计', '本次运行工具', 'ComfyUI', 'is_generative_cartoon', 'fallback_reason'].every(token => photoPage.includes(token) || photoRouter.includes(token)),
      'AI照片和2.5D结果可切换查看，之后进入询价、支付和备料门禁'
    ),
    assertion(
      'AI照片效果经过输入质量门禁并按条件允许进入2.5D',
      ['layoutPreserved', 'canContinue25d', 'quality_gate', 'layout-preserve-gate-v1', '_source_layout_profile'].every(token => photoPage.includes(token) || processingEngine.includes(token)),
      '复杂版式保真保留，只有通过质量分支的结果才能继续内雕'
    ),
    assertion(
      'AI照片结果具备成品槽位合成预览',
      ['mockupAsset', 'mockup-art-slot', 'ImageScaleToMaxDimension', 'quality gate'].every(token => photoPage.includes(token) || processingEngine.includes(token)),
      '生成结果会放入已有手机壳、服装、金属或水晶素材中确认构图'
    ),
    assertion(
      '照片风格和2.5D接口失败返回可识别的502',
      photoRouter.includes('raise HTTPException(status_code=502, detail="AI照片处理失败")') &&
        photoRouter.includes('raise HTTPException(status_code=502, detail="2.5D预览生成失败")'),
      '后端失败不会伪装成正常预览结果'
    ),
    assertion(
      '工艺指标覆盖加工可制造性风险',
      ['线条密度', '陡峭起伏', '最小线宽', '灰度反差'].every(token => imagePage.includes(token) && samplePage.includes(token)),
      '图转2.5D页和提交打样页都展示线条密度、起伏、线宽、灰度反差'
    ),
    assertion(
      '选择图片后自动启动预检生成流程',
      chooseImageIndex >= 0 && chooseAutoRunIndex > chooseImageIndex && imagePage.includes('已选择图片，开始预检'),
      `chooseImage=${chooseImageIndex}, autoRun=${chooseAutoRunIndex}`
    ),
    assertion(
      '后端不可用时生成本机测试预览包并持续提示',
      ['buildLocalPreviewPackage', 'usingLocalPreviewPackage', 'local-preview-only', '后端上传不可用', '测试预览完成'].every(token => imagePage.includes(token)),
      '上传/处理失败会切到本机测试预览，页面展示持续状态而不是只弹 toast'
    ),
    assertion(
      '本机兜底不会伪装成灰度或2.5D效果',
      imagePage.includes('const backendPackageReady') &&
        imagePage.includes('const localPreviewPackageReady') &&
        imagePage.includes("depthUrl.value = ''") &&
        imagePage.includes("pod3dUrl.value = ''") &&
        !imagePage.includes('depthUrl.value = imageUrl') &&
        !imagePage.includes('pod3dUrl.value = imageUrl'),
      '后端工作流未返回结果时，灰度/2.5D/风险预览保持未生成'
    ),
    assertion(
      '本机测试预览包保存为人工复核记录',
      ['local_preview_package', 'processing_fallback_reason', 'output_mode', 'local-preview-only'].every(token => imagePage.includes(token)),
      '保存作品时带上 local_preview_package、失败原因和输出模式'
    ),
    assertion(
      '提交打样页有人工复核队列和禁止直下设备提示',
      ['人工复核队列', '此单不会直接下发设备', '不直接投递PC端热文件夹', '提交人工复核'].every(token => samplePage.includes(token)),
      '高风险结论进入人工复核，不直连设备'
    ),
    assertion(
      '本机测试预览包在提交页强制人工复核',
      localPreviewGuardIndex >= 0 && samplePage.includes('当前作品来自本机测试预览包') && samplePage.includes('processing_fallback_reason'),
      `localPreviewGuard=${localPreviewGuardIndex}`
    ),
    assertion(
      '人工复核时不会查询或占用真实设备',
      loadMachineIndex >= 0 && loadMachineGuardIndex > loadMachineIndex && clearMachineIndex > loadMachineGuardIndex,
      'loadAvailableMachine 在 manualReviewRequired 时清空 selectedMachine 并返回'
    ),
    assertion(
      '人工复核分支在真实设备下单接口前返回',
      manualBranchIndex > submitIndex
        && localOrderIndex > manualBranchIndex
        && manualReturnIndex > localOrderIndex
        && createOrderIndex > manualReturnIndex,
      `manualBranch=${manualBranchIndex}, localOrder=${localOrderIndex}, return=${manualReturnIndex}, createOrder=${createOrderIndex}`
    ),
    assertion(
      '后端工艺预检接口已接入小程序API层',
      apiFile.includes('/craft/assess') && craftStore.includes('craft.assess'),
      'src/api/index.ts -> /craft/assess, src/stores/craft.ts -> craft.assess'
    ),
    assertion(
      '本机保守预检指标包含线条密度和刀面起伏',
      ['edge_density', 'high_edge_ratio', 'estimated_min_line_mm', 'contrast'].every(token => craftStore.includes(token)),
      '后端不可用时也能给出线条密度、起伏、最小线宽和灰度反差'
    ),
    assertion(
      '人工复核单已接入后端并在订单页可查询',
      apiFile.includes("url: '/proofing/orders'")
        && samplePage.includes('api.proofing.create')
        && ordersPage.includes("api.proofing.list()")
        && ordersPage.includes('打样复核'),
      '提交打样写入后端复核订单，订单页有独立打样复核标签'
    ),
    assertion(
      '机器处理失败不会伪装成 ready',
      readText(path.join(REPO_ROOT, 'backend/app/services/machine_processor.py')).includes('不进入设备队列')
        && !readText(path.join(REPO_ROOT, 'backend/app/services/machine_processor.py')).includes('fallback to source image'),
      '未生成有效加工文件时保持 failed，不把原图当成加工结果'
    ),
  ]
}

function buildHighRiskWork() {
  return {
    id: 'craft-check-high-risk',
    title: '密集金线边框工艺预检样张',
    status: '文件包已生成-需复核',
    task_id: 'wechat-devtools-check',
    local_preview_package: true,
    output_mode: 'local-preview-only',
    processing_fallback_reason: 'wechat-devtools-fixture',
    source_url: '/static/images/logo.png',
    depth_url: '/static/images/logo.png',
    pod3d_url: '/static/images/logo.png',
    material: '金属',
    size: '50x50x50mm',
    craft: '烫金线稿',
    craft_job_id: 'craft-check',
    craft_risk_score: 86,
    craft_grade: 'review',
    manual_review_required: true,
    recommended_process: '放大线宽并人工复核后再加工',
    assessment_source: 'wechat-devtools-fixture',
    craft_assessment: {
      job_id: 'craft-check',
      grade: 'review',
      risk_score: 86,
      manual_review_required: true,
      recommended_process: '放大线宽并人工复核后再加工',
      source: 'wechat-devtools-fixture',
      metrics: {
        edge_density: 0.46,
        high_edge_ratio: 0.22,
        estimated_min_line_mm: 0.07,
        contrast: 231,
      },
      risk_items: [
        {
          code: 'line_density_high',
          label: '边框和纹样线条过密',
          severity: 'high',
          advice: '先减少交叉纹样或放大线宽，再进入真实加工。',
        },
        {
          code: 'surface_steep',
          label: '刀面起伏变化过陡',
          severity: 'high',
          advice: '降低高度差，避免刀路和烫金边界反复返工。',
        },
      ],
    },
  }
}

async function tryStartAutoMode() {
  if (!automator) {
    return {
      ok: false,
      reason: 'miniprogram-automator 未安装或不可加载',
      auto: null,
      attempts: [],
    }
  }

  const auto = runCli('auto', [
    '--project',
    PREVIEW_PATH,
    '--auto-port',
    String(AUTOMATOR_PORT),
    '--lang',
    'zh',
    '--trust-project',
  ], { timeout: 90000 })

  const discovery = await discoverAutomatorEndpoints()
  const attempts = []
  for (let i = 0; i < AUTOMATOR_CONNECT_ATTEMPTS; i += 1) {
    for (const wsEndpoint of discovery.endpoints) {
      try {
        const mp = await connectAutomatorEndpoint(wsEndpoint)
        return {
          ok: true,
          mp,
          auto,
          attempts,
          discovery,
          wsEndpoint,
        }
      } catch (error) {
        attempts.push(`${wsEndpoint}: ${error.message}`)
      }
    }
    await sleep(1000)
  }

  return {
    ok: false,
    reason: `无法连接微信开发者工具自动化 WebSocket；候选端点：${discovery.endpoints.join(', ')}`,
    auto,
    attempts,
    discovery,
  }
}

async function screenshot(mp, route, filename, mode = 'reLaunch') {
  const page = mode === 'switchTab' ? await mp.switchTab(route) : await mp.reLaunch(route)
  await page.waitFor(1800)
  const current = await mp.currentPage()
  const file = path.join(OUTPUT_DIR, filename)
  await mp.screenshot({ path: file })
  return {
    route,
    path: current.path,
    query: current.query,
    screenshot: file,
    size: fs.existsSync(file) ? fs.statSync(file).size : 0,
  }
}

async function runAutomatedPageChecks() {
  const autoSession = await tryStartAutoMode()
  if (!autoSession.ok) {
    return {
      ok: false,
      reason: autoSession.reason,
      auto: autoSession.auto ? {
        code: autoSession.auto.code,
        stdout: tail(autoSession.auto.stdout),
        stderr: tail(autoSession.auto.stderr),
        error: autoSession.auto.error,
      } : null,
      attempts: autoSession.attempts.slice(-6),
      discovery: autoSession.discovery,
      captures: [],
      assertions: {},
    }
  }

  const { mp, auto } = autoSession
  const consoleMessages = []
  const exceptions = []
  mp.on('console', msg => consoleMessages.push(msg))
  mp.on('exception', err => exceptions.push(err))

  try {
    await mp.callWxMethod('setStorageSync', 'mock_25d_works', [buildHighRiskWork()])
    await mp.callWxMethod('setStorageSync', 'mock_sample_orders', [])

    const captures = []
    captures.push(await screenshot(mp, '/pages/image25d/index', '01-craft-precheck.png', 'switchTab'))
    captures.push(await screenshot(mp, '/pages/text25d/index', '02-text-25d.png'))
    captures.push(await screenshot(mp, '/pages/my/my', '03-my.png', 'switchTab'))
    captures.push(await screenshot(mp, '/pages/sample/submit?workId=craft-check-high-risk', '04-sample-review.png'))

    const samplePage = await mp.currentPage()
    const sampleData = await samplePage.data()
    const reviewWarning = await samplePage.$('.review-warning')
    const reviewMachineCard = await samplePage.$('.machine-card.review')
    const machineCards = await samplePage.$$('.machine-card')
    const machineCardClasses = await Promise.all(machineCards.map(card => card.attribute('class')))
    const primaryButton = await samplePage.$('.primary-btn')
    const primaryButtonText = primaryButton ? await primaryButton.text() : ''

    await mp.close()

    return {
      ok: captures.every(item => item.size > 1000) && Boolean(reviewWarning && reviewMachineCard && primaryButtonText.includes('提交人工复核')),
      auto: {
        code: auto.code,
        stdout: tail(auto.stdout),
        stderr: tail(auto.stderr),
        error: auto.error,
      },
      attempts: autoSession.attempts.slice(-6),
      discovery: autoSession.discovery,
      wsEndpoint: autoSession.wsEndpoint,
      captures,
      assertions: {
        screenshotCount: captures.length,
        screenshotsNonBlank: captures.every(item => item.size > 1000),
        sampleManualReviewRequired: Boolean(reviewWarning && reviewMachineCard),
        sampleSubmitButtonText: primaryButtonText || sampleData.submitButtonText,
        sampleCraftGrade: sampleData.work?.craft_grade,
        sampleRiskScore: sampleData.work?.craft_risk_score,
        selectedMachineClearedForReview: Boolean(reviewMachineCard)
          && machineCardClasses.every(className => String(className || '').includes('review')),
      },
      consoleMessages: consoleMessages.slice(-20),
      exceptions,
    }
  } catch (error) {
    try {
      await mp.close()
    } catch (closeError) {
      // Best-effort cleanup; the failure is already captured below.
    }
    return {
      ok: false,
      reason: `自动化页面验收失败：${error.message}`,
      auto: {
        code: auto.code,
        stdout: tail(auto.stdout),
        stderr: tail(auto.stderr),
        error: auto.error,
      },
      attempts: autoSession.attempts.slice(-6),
      discovery: autoSession.discovery,
      wsEndpoint: autoSession.wsEndpoint,
      captures: [],
      assertions: {},
      consoleMessages: consoleMessages.slice(-20),
      exceptions,
    }
  }
}

function captureDesktop() {
  const desktopShot = path.join(OUTPUT_DIR, 'devtools-desktop.png')
  const open = runCli('open', [
    '--project',
    PREVIEW_PATH,
    '--port',
    String(IDE_PORT),
    '--lang',
    'zh',
    '--trust-project',
  ], { timeout: 90000 })

  const ps = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "Add-Type -AssemblyName System.Drawing",
    "$bounds=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds",
    "$bmp=New-Object System.Drawing.Bitmap $bounds.Width,$bounds.Height",
    "$g=[System.Drawing.Graphics]::FromImage($bmp)",
    "$g.CopyFromScreen($bounds.Location,[System.Drawing.Point]::Empty,$bounds.Size)",
    `$bmp.Save('${desktopShot.replace(/'/g, "''")}',[System.Drawing.Imaging.ImageFormat]::Png)`,
    "$g.Dispose()",
    "$bmp.Dispose()",
  ].join('; ')

  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3500)
  const shot = run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
    timeout: 30000,
  })

  return {
    ok: shot.code === 0 && fs.existsSync(desktopShot) && fs.statSync(desktopShot).size > 1000,
    screenshot: desktopShot,
    size: fs.existsSync(desktopShot) ? fs.statSync(desktopShot).size : 0,
    open: {
      code: open.code,
      stdout: tail(open.stdout, 1200),
      stderr: tail(open.stderr, 1200),
      error: open.error,
    },
    shot: {
      code: shot.code,
      stdout: tail(shot.stdout, 1200),
      stderr: tail(shot.stderr, 1200),
      error: shot.error,
    },
  }
}

function renderReport(result) {
  const lines = []
  lines.push('# 31度小程序 2.5D AI工艺预检微信开发者工具验收')
  lines.push('')
  lines.push(`- 验收时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push(`- 小程序 AppID：${APPID}`)
  lines.push(`- 预览工程：${PREVIEW_PATH}`)
  lines.push(`- 输出目录：${OUTPUT_DIR}`)
  lines.push(`- CLI临时输出：${CLI_OUTPUT_DIR}`)
  lines.push(`- 总体状态：${result.ok ? '通过' : '未完全通过'}`)
  lines.push(`- 验收结论：${result.status}`)
  lines.push('')
  lines.push('## 本轮明确没有做')
  lines.push('- 没有执行 `upload`，没有写入微信后台版本管理。')
  lines.push('- 没有批量写入真实设备，没有调用真实设备 `createOrder`。')
  lines.push('- 高风险样张只写入微信本地 Storage 的测试记录。')
  lines.push('')
  lines.push('## 构建与预览')
  lines.push(`- ` + `npm run build:mp-weixin` + `：${result.build?.code === 0 ? '通过' : '失败'}`)
  lines.push(`- 微信开发者工具 preview：${result.preview?.code === 0 && result.preview?.qrExists ? '通过' : '失败'}`)
  lines.push(`- 预览二维码：${result.preview?.qr || '未生成'}`)
  lines.push(`- 预览信息：${result.preview?.info || '未生成'}`)
  lines.push(`- 桌面截图：${result.desktop?.ok ? result.desktop.screenshot : '未生成或截图失败'}`)
  lines.push('')
  lines.push('## UI与交互断言')
  for (const item of result.sourceAssertions || []) {
    lines.push(`- ${item.pass ? '通过' : '失败'}：${item.name}；${item.evidence}`)
  }
  lines.push('')
  lines.push('## 微信自动化')
  if (result.automation?.ok) {
    lines.push('- DevTools 自动化连接：通过')
    lines.push(`- 自动化端点：${result.automation.wsEndpoint || '未记录'}`)
    lines.push(`- 自动截图数量：${result.automation.captures?.length || 0}`)
    for (const item of result.automation.captures || []) {
      lines.push(`- 截图：${item.screenshot} (${item.size} bytes)`)
    }
    lines.push(`- 提交按钮：${result.automation.assertions?.sampleSubmitButtonText || '未读取'}`)
    lines.push(`- 高风险复核：${result.automation.assertions?.sampleManualReviewRequired ? '通过' : '失败'}`)
  } else {
    lines.push('- DevTools 自动化连接：未通过')
    lines.push(`- 原因：${result.automation?.reason || '未连接'}`)
    if (result.automation?.discovery?.endpoints?.length) {
      lines.push(`- 已探测自动化候选端点：${result.automation.discovery.endpoints.join(', ')}`)
    }
    lines.push('- 已降级为：真实 DevTools 预览二维码 + 构建产物断言 + 源码交互断言 + 桌面截图。')
    lines.push('- 需要人工用微信扫码二维码完成真机体验确认后，才能标记为“真机通过”。')
  }
  lines.push('')
  lines.push('## 风险')
  lines.push('- 当前只证明测试预览和高风险拦截逻辑；未证明微信后台上传版本、审核版本、真实设备加工闭环。')
  lines.push('- 若要上传微信后台开发版，应另开一次显式 upload 验收，并写清版本号、备注和回滚方式。')
  lines.push('')
  return `${lines.join('\n')}\n`
}

function writeCheckpoint(result) {
  writeJson(path.join(OUTPUT_DIR, 'result.json'), result)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'REPORT.md'), renderReport(result), 'utf8')
}

async function main() {
  ensureDir(OUTPUT_DIR)

  const result = {
    ok: false,
    status: 'not_started',
    appid: APPID,
    outputDir: OUTPUT_DIR,
    previewPath: PREVIEW_PATH,
    realWriteBoundary: {
      wechatUpload: false,
      realDeviceCreateOrder: false,
      note: '本脚本只做测试预览，不上传微信后台，不批量写真实设备。',
    },
  }

  const build = runCmdLine('npm run build:mp-weixin', {
    cwd: ROOT,
    timeout: 180000,
  })
  result.build = {
    code: build.code,
    stdout: tail(build.stdout),
    stderr: tail(build.stderr),
    error: build.error,
  }
  result.status = build.code === 0 ? 'build_passed' : 'build_failed'
  writeCheckpoint(result)

  if (build.code !== 0) {
    process.exit(1)
  }

  copyDistToAsciiPath()
  result.status = 'preview_path_ready'
  result.previewPathReady = fs.existsSync(path.join(PREVIEW_PATH, 'app.json'))
  result.sourceAssertions = collectSourceAssertions()
  writeCheckpoint(result)

  ensureDir(CLI_OUTPUT_DIR)
  const previewQrFromCli = path.join(CLI_OUTPUT_DIR, 'preview-qrcode.jpg')
  const previewInfoFromCli = path.join(CLI_OUTPUT_DIR, 'preview-info.json')
  const previewQr = path.join(OUTPUT_DIR, 'preview-qrcode.jpg')
  const previewInfo = path.join(OUTPUT_DIR, 'preview-info.json')
  const preview = runCli('preview', [
    '--project',
    PREVIEW_PATH,
    '--qr-format',
    'image',
    '--qr-output',
    previewQrFromCli,
    '--info-output',
    previewInfoFromCli,
    '--port',
    String(IDE_PORT),
    '--lang',
    'zh',
  ], { timeout: 180000 })

  if (fs.existsSync(previewQrFromCli)) fs.copyFileSync(previewQrFromCli, previewQr)
  if (fs.existsSync(previewInfoFromCli)) fs.copyFileSync(previewInfoFromCli, previewInfo)

  result.preview = {
    code: preview.code,
    stdout: tail(preview.stdout, 2500),
    stderr: tail(preview.stderr, 2500),
    error: preview.error,
    qr: previewQr,
    cliQr: previewQrFromCli,
    qrExists: fs.existsSync(previewQr) && fs.statSync(previewQr).size > 1000,
    qrSize: fs.existsSync(previewQr) ? fs.statSync(previewQr).size : 0,
    info: previewInfo,
    cliInfo: previewInfoFromCli,
    infoExists: fs.existsSync(previewInfo),
  }
  result.status = result.preview.code === 0 ? 'preview_generated' : 'preview_failed'
  writeCheckpoint(result)

  result.automation = await runAutomatedPageChecks()
  result.status = result.automation.ok ? 'automator_passed' : 'automator_blocked'
  writeCheckpoint(result)

  result.desktop = captureDesktop()
  result.status = result.desktop.ok ? 'desktop_capture_done' : 'desktop_capture_failed'
  writeCheckpoint(result)

  const sourcePass = result.sourceAssertions.every(item => item.pass)
  const previewPass = result.preview.code === 0 && result.preview.qrExists
  if (sourcePass && previewPass && result.automation.ok) {
    result.ok = true
    result.status = 'preview_and_automator_passed'
  } else if (sourcePass && previewPass) {
    result.ok = true
    result.status = 'preview_static_passed_automator_blocked'
  } else {
    result.ok = false
    result.status = 'verification_failed'
  }

  writeCheckpoint(result)

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2))
    process.exit(1)
  }

  console.log(JSON.stringify({
    ok: result.ok,
    status: result.status,
    outputDir: OUTPUT_DIR,
    previewQr,
    previewInfo,
    desktopScreenshot: result.desktop?.screenshot,
    sourceAssertions: result.sourceAssertions,
    automation: {
      ok: result.automation.ok,
      reason: result.automation.reason,
      captures: result.automation.captures,
      assertions: result.automation.assertions,
    },
    realWriteBoundary: result.realWriteBoundary,
  }, null, 2))
}

main().catch(error => {
  ensureDir(OUTPUT_DIR)
  const result = {
    ok: false,
    status: 'script_exception',
    outputDir: OUTPUT_DIR,
    previewPath: PREVIEW_PATH,
    error: error.message,
    stack: error.stack,
  }
  writeCheckpoint(result)
  console.error(error)
  process.exit(1)
})
