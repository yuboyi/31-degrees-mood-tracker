import assert from 'node:assert/strict'
import test from 'node:test'
import { parseQrEntry } from '../src/utils/qrEntry.mjs'

test('backend store and machine QR scene formats', () => {
  assert.equal(parseQrEntry({ scene: 'store_42' }).storeId, 42)
  assert.equal(parseQrEntry({ scene: 'store%5F42' }).storeId, 42)
  assert.equal(parseQrEntry({ store_id: '42' }).storeId, 42)
  assert.equal(parseQrEntry({ scene: 'machine_DEMO_1' }).machineCode, 'DEMO_1')
})

test('encoded supported web QR and conflicting identifiers', () => {
  assert.equal(parseQrEntry({ q: encodeURIComponent('https://ai.31du.com/scan?scene=store_42') }).storeId, 42)
  assert.equal(parseQrEntry({ q: encodeURIComponent('https://ai.31du.com/scan?store_id=42') }).storeId, 42)
  assert.equal(parseQrEntry({ scene: 'store_42', store_id: '43' }).kind, 'invalid')
  assert.equal(parseQrEntry({ q: 'https://ai.31du.com/scan?scene=store_42&scene=store_43' }).kind, 'invalid')
  assert.equal(parseQrEntry({ q: 'https://other.example/scan?store_id=42' }).kind, 'invalid')
})

test('opaque tenant scene is not interpreted as local store', () => {
  assert.equal(parseQrEntry({ scene: 't7668a9b8_a468194a' }).kind, 'tenant')
  assert.equal(parseQrEntry({ scene: 't7668a9b8_a468194a' }).storeId, undefined)
})

test('configured secondary domain preserves tenant scene without claiming a binding', () => {
  const scene = 'ttest123_test456'
  const entry = parseQrEntry({ q: encodeURIComponent(`https://quickin.top/scan?scene=${scene}`) })
  assert.deepEqual(entry, { kind: 'tenant', scene })
  assert.equal(entry.storeId, undefined)
  for (const url of [
    `https://quickin.top.other.example/scan?scene=${scene}`,
    `https://quickin.top@other.example/scan?scene=${scene}`,
    `https://other.example/scan?scene=${scene}`,
    `https://quickin.top/scan?scene=${scene}&store_id=42`,
    'https://quickin.top/scan?store_id=792029516720549952',
  ]) assert.equal(parseQrEntry({ q: url }).kind, 'invalid', url)
})

test('malformed or ambiguous input is rejected without throwing', () => {
  for (const value of ['', '%', '%ZZ', 'store_0', 'store_-1', 'store_12abc', 'store_9007199254740992',
    'machine_', 'machine_DEMO?store_id=42', '42', 'store_01']) {
    assert.equal(parseQrEntry({ scene: value }).kind, 'invalid', value)
  }
  assert.equal(parseQrEntry({ store_id: '12abc' }).kind, 'invalid')
})
