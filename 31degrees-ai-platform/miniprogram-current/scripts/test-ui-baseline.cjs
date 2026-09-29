const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { uiFingerprint, checkUiBaseline } = require('./check-ui-baseline.cjs')

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), '31du-ui-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(path.join(root, 'pages/index'), { recursive: true })
  fs.mkdirSync(path.join(root, 'static'))
  const page = path.join(root, 'pages/index/index.vue')
  fs.writeFileSync(page, '<template><view>Existing UI</view></template><script setup>const n = 1</script><style scoped>view{color:red}</style>')
  fs.writeFileSync(path.join(root, 'pages.json'), JSON.stringify({ pages: [{ path: 'pages/index/index' }] }))
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({ 'mp-weixin': { appid: 'test-app' } }))
  fs.writeFileSync(path.join(root, 'static/model.png'), 'synthetic-hash-fixture-not-an-image')
  const baselineFile = path.join(root, 'baseline.json')
  const baseline = { schema_version: 1, verified_published_source: true, source_system: 'ai.31du.com',
    app_id: 'test-app', release_version: 'test-only', files: uiFingerprint(root) }
  fs.writeFileSync(baselineFile, JSON.stringify(baseline))
  return { root, page, baselineFile, baseline }
}
test('missing or mismatched release identity blocks uploads', t => {
  const f = fixture(t)
  assert.equal(checkUiBaseline(f.root, path.join(f.root, 'missing.json')).passed, false)
  f.baseline.app_id = 'different-app'
  fs.writeFileSync(f.baselineFile, JSON.stringify(f.baseline))
  assert.equal(checkUiBaseline(f.root, f.baselineFile).passed, false)
})
test('logic-only updates and additional assets do not change the UI baseline', t => {
  const f = fixture(t)
  fs.writeFileSync(f.page, fs.readFileSync(f.page, 'utf8').replace('const n = 1', 'const n = 2'))
  fs.writeFileSync(path.join(f.root, 'static/new-template.png'), 'new-fixture')
  assert.equal(checkUiBaseline(f.root, f.baselineFile).passed, true)
})
test('layout, navigation and original artwork modifications are rejected', t => {
  const f = fixture(t)
  fs.writeFileSync(f.page, fs.readFileSync(f.page, 'utf8').replace('color:red', 'color:blue'))
  fs.writeFileSync(path.join(f.root, 'pages.json'), '{}')
  fs.writeFileSync(path.join(f.root, 'static/model.png'), 'replacement-art')
  const result = checkUiBaseline(f.root, f.baselineFile)
  assert.equal(result.passed, false)
  assert.equal(result.changed.length, 3)
})
test('new or missing UI pages cannot pass silently', t => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.root, 'pages/new.vue'), '<template><view /></template>')
  fs.unlinkSync(f.page)
  const result = checkUiBaseline(f.root, f.baselineFile)
  assert.equal(result.passed, false)
  assert.equal(result.changed.length, 2)
})
