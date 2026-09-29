const assert = require('node:assert/strict')
const test = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function load(name, reply) {
  const calls = []
  const source = fs.readFileSync(path.join(__dirname, '../src/skill/pkg-ai/engrave-25d/apis', name + '.js'), 'utf8')
  const context = { module: { exports: {} }, require: () => ({
    request: async (url, data, method) => { calls.push({ url, data, method }); return reply(url, data) },
    uploadFile: async () => '/synthetic/upload.png',
    normalizeUrl: url => 'https://example.invalid' + url,
  }) }
  vm.runInNewContext(source, context)
  return { run: context.module.exports, calls }
}

test('exact order uses one detail lookup, never falls back to recent orders', async () => {
  const h = load('queryEngravingStatus', () => ({ id: 42, status: 'ready' }))
  const result = await h.run({ orderId: '42' })
  assert.equal(result.isError, false)
  assert.equal(h.calls.length, 1)
  assert.equal(h.calls[0].url, '/machine/order/42')
  assert.equal(result.structuredContent.orders[0].id, 42)
  assert.match(result.content[0].text, /待设备接收/)
})

test('invalid IDs make no calls; wrong detail and denied requests are not successes', async () => {
  for (const orderId of ['../2', 0, -1, '9007199254740993']) {
    const h = load('queryEngravingStatus', () => ({}))
    assert.equal((await h.run({ orderId })).isError, true)
    assert.equal(h.calls.length, 0)
  }
  for (const reply of [() => ({ id: 99 }), () => { throw new Error('denied') }]) {
    const h = load('queryEngravingStatus', reply)
    assert.equal((await h.run({ orderId: '42' })).isError, true)
    assert.equal(h.calls.length, 1)
  }
})

test('total failure and malformed responses cannot look like empty successful orders', async () => {
  for (const reply of [() => { throw new Error('offline') }, () => '<html>', () => ({ unexpected: [] })]) {
    const result = await load('queryEngravingStatus', reply).run({})
    assert.equal(result.isError, true)
    assert.match(result.content[0].text, /不代表没有订单/)
  }
})

test('partial failure preserves results and warns; completed task is not physical completion', async () => {
  const result = await load('queryEngravingStatus', url => {
    if (url === '/machine/orders') throw new Error('offline')
    return { tasks: [{ id: 2, status: 'completed' }] }
  }).run({})
  assert.equal(result.structuredContent.partial, true)
  assert.match(result.content[0].text, /设备订单查询失败/)
  assert.match(result.content[0].text, /不代表实物加工完成/)
})

test('successful empty queries are distinguished from failure', async () => {
  const result = await load('queryEngravingStatus', () => []).run({})
  assert.equal(result.isError, false)
  assert.equal(result.structuredContent.partial, false)
  assert.match(result.content[0].text, /本次未查到当前账号/)
})

test('inkjet style workflow does not invoke laser services and preserves handoff', async () => {
  const h = load('makeAIStylePhoto', url => {
    if (url === '/photo-jobs') return { id: 12 }
    assert.equal(url, '/photo-jobs/12/style')
    return { id: 12, status: 'optimized', optimized_image_url: '/synthetic/style.png', runtime: { is_generative_cartoon: true } }
  })
  const result = await h.run({ imagePath: 'synthetic.png', template: 'red' })
  assert.equal(result.isError, false)
  assert.equal(h.calls.length, 2)
  assert.equal(result.structuredContent.depth_url, undefined)
  assert.equal(result.handoff().payload.styled_url, 'https://example.invalid/synthetic/style.png')
  assert.equal(result.handoff().payload.photo_job_id, 12)
  assert.match(result.content[0].text, /尚未付款或提交打印/)
})

test('missing generated image is an error, not a successful card', async () => {
  for (const optimized_url of [undefined, '', '  ', {}]) {
    const h = load('makeAIStylePhoto', url => url === '/photo-jobs' ? { id: 12 } :
      { id: 12, status: 'optimized', optimized_image_url: optimized_url })
    assert.equal((await h.run({ imagePath: 'synthetic.png' })).isError, true)
    assert.equal(h.calls.length, 2)
  }
})

test('non-generative fallback is disclosed and wrong job cannot be handed off', async () => {
  const h = load('makeAIStylePhoto', url => url === '/photo-jobs' ? { id: 12 } :
    { id: 12, status: 'optimized', optimized_image_url: '/synthetic/fallback.png', runtime: { is_generative_cartoon: false } })
  assert.match((await h.run({ imagePath: 'synthetic.png' })).content[0].text, /未确认完成生成式卡通/)
  const bad = load('makeAIStylePhoto', url => url === '/photo-jobs' ? { id: 12 } :
    { id: 13, status: 'optimized', optimized_image_url: '/other-job.png' })
  assert.equal((await bad.run({ imagePath: 'synthetic.png' })).isError, true)
})
