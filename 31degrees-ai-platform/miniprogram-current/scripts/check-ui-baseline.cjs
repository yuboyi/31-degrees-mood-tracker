const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { parse } = require('@vue/compiler-sfc')

const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const isAsset = name => name.startsWith('static/') && /\.(png|jpe?g|webp|svg|gif|woff2?|ttf)$/i.test(name)

function uiFingerprint(root) {
  const files = {}
  function visit(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(dir, item.name)
      const relative = path.relative(root, filename).split(path.sep).join('/')
      if (item.isSymbolicLink()) throw new Error('UI source must not contain symlinks')
      if (item.isDirectory()) { visit(filename); continue }
      if (/\.vue$/.test(relative)) {
        const { descriptor, errors } = parse(fs.readFileSync(filename, 'utf8'), { filename })
        if (errors.length) throw new Error('Invalid Vue source: ' + relative)
        const block = value => value ? { content: value.content, attrs: value.attrs } : null
        files[relative] = hash(JSON.stringify({ template: block(descriptor.template), styles: descriptor.styles.map(block) }))
      } else if (relative === 'pages.json' || /\.(scss|css)$/.test(relative) || isAsset(relative)) {
        files[relative] = hash(fs.readFileSync(filename))
      }
    }
  }
  visit(root)
  return files
}

function checkUiBaseline(root, filename) {
  if (!fs.existsSync(filename)) return { passed: false, reason: 'Missing verified published UI baseline', changed: [] }
  const baseline = JSON.parse(fs.readFileSync(filename, 'utf8'))
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))
  if (baseline.schema_version !== 1 || baseline.verified_published_source !== true ||
      baseline.source_system !== 'ai.31du.com' || !baseline.release_version ||
      baseline.app_id !== manifest['mp-weixin']?.appid ||
      !baseline.files?.['pages.json'] || !baseline.files?.['pages/index/index.vue']) {
    return { passed: false, reason: 'Published source identity or UI evidence is incomplete', changed: [] }
  }
  const current = uiFingerprint(root)
  const changed = []
  for (const [name, digest] of Object.entries(baseline.files)) {
    if (current[name] !== digest) changed.push({ file: name, reason: current[name] ? 'modified' : 'missing' })
  }
  for (const name of Object.keys(current)) {
    if (!(name in baseline.files) && !isAsset(name)) changed.push({ file: name, reason: 'new UI file' })
  }
  return { passed: changed.length === 0, releaseVersion: baseline.release_version, changed,
    note: 'Source structure check only; real-device visual comparison is also required.' }
}

function requireUiBaseline() {
  const root = path.resolve(__dirname, '../src')
  const baseline = path.resolve(__dirname, '../../inputs/31du-release/ui-baseline.json')
  const result = checkUiBaseline(root, baseline)
  console.log(JSON.stringify(result, null, 2))
  if (!result.passed) throw new Error('线上UI基线未核准或存在界面差异，禁止上传覆盖。')
  return result
}

module.exports = { uiFingerprint, checkUiBaseline, requireUiBaseline }
if (require.main === module) {
  try { requireUiBaseline() } catch (error) { console.error(error.message); process.exitCode = 1 }
}
