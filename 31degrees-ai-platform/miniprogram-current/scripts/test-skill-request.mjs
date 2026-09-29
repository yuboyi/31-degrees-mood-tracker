import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'

const source = readFileSync(new URL('../src/skill/pkg-ai/engrave-25d/apis/_request.js', import.meta.url), 'utf8')
function harness(response, loggedIn = true) {
  const writes = []
  const context = { module: { exports: {} }, wx: {
    getStorageSync: key => key === 'token' && loggedIn ? 'synthetic-fixture' : '',
    setStorageSync: (...args) => writes.push(args),
    login: options => options.success({ code: 'synthetic-code' }),
    request: options => options.success(response),
    uploadFile: options => options.success(response),
  } }
  vm.runInNewContext(source, context)
  return { api: context.module.exports, writes }
}
test('workflow rejects HTML and business auth failures rather than returning null', async () => {
  for (const data of ['<html>admin</html>', { code: '401' }, { status: 'failed' }]) {
    const { api } = harness({ statusCode: 200, data })
    await assert.rejects(api.request('/preview'))
  }
})
test('workflow auth errors cannot persist a misleading token', async () => {
  const { api, writes } = harness({ statusCode: 200, data: { code: 401, token: 'synthetic-failed' } }, false)
  await assert.rejects(api.ensureLogin())
  assert.equal(writes.length, 0)
})
test('workflow rejects object upload URLs and preserves valid preview data', async () => {
  await assert.rejects(harness({ statusCode: 200, data: { data: {} } }).api.uploadFile('fixture.png'))
  const { api } = harness({ statusCode: 200, data: '{"url":"/static/preview.png"}' })
  assert.equal(await api.uploadFile('fixture.png'), '/static/preview.png')
  assert.equal((await api.request('/preview')).url, '/static/preview.png')
  assert.equal(api.normalizeUrl('/static/preview.png'), 'https://ai.31du.com/static/preview.png')
  assert.equal(api.normalizeUrl('static/preview.png'), 'https://ai.31du.com/static/preview.png')
})
