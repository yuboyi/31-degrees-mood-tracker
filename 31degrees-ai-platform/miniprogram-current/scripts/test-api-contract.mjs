import assert from 'node:assert/strict'
import test from 'node:test'
import { validateApiResponse, API_BASE_URL } from '../src/utils/apiContract.mjs'
import { checkBackendContract } from './check-backend-contract.mjs'

test('HTTP 200 HTML, null and wrong catalog shape are not success', () => {
  for (const data of ['<!DOCTYPE html><title>Admin</title>', null, 'null', {}, { data: [] }]) {
    assert.throws(() => validateApiResponse(200, data, '/templates'))
  }
})
test('auth and failed business responses cannot be hidden by a token field', () => {
  for (const data of [{ code: '401', token: 'synthetic-fixture' }, { success: false }, { status: 'failed' }]) {
    assert.throws(() => validateApiResponse(200, data))
  }
  assert.throws(() => validateApiResponse(500, { templates: [] }, '/templates'))
})
test('valid JSON string and object responses retain their shape', () => {
  assert.deepEqual(validateApiResponse(200, '{"templates":[]}', '/templates'), { templates: [] })
  assert.deepEqual(validateApiResponse(200, { code: 0, data: [] }), { code: 0, data: [] })
  assert.deepEqual(validateApiResponse(200, { template_types: [] }, '/template-types'), { template_types: [] })
})
test('preflight uses credential-free GET and rejects the real HTML fallback pattern', async () => {
  const urls = []
  const result = await checkBackendContract(async (url, options) => {
    urls.push(url)
    assert.equal(options.method, 'GET')
    assert.equal(options.redirect, 'error')
    assert.deepEqual(options.headers, { Accept: 'application/json' })
    return new Response('<!doctype html><div id="app"></div>', { headers: { 'content-type': 'text/html' } })
  })
  assert.equal(result.passed, false)
  assert.deepEqual(urls, [API_BASE_URL + '/template-types', API_BASE_URL + '/templates'])
  assert.equal(JSON.stringify(result).includes('<!doctype'), false)
})
test('preflight passes compatible catalogs and stops on access denial/backoff', async () => {
  const result = await checkBackendContract(async url => new Response(JSON.stringify(
    url.endsWith('/template-types') ? { template_types: [] } : { templates: [] }
  )))
  assert.equal(result.passed, true)
  for (const status of [401, 403, 429]) {
    let count = 0
    const denied = await checkBackendContract(async () => { count++; return new Response('{}', { status }) })
    assert.equal(denied.passed, false)
    assert.equal(count, 1)
  }
})
