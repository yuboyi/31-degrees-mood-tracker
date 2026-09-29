import assert from 'node:assert/strict'
import test from 'node:test'
import { selectablePhotoTypes, keepSelectedPhotoType } from '../src/utils/photoProductChoice.mjs'

test('photo flow never silently chooses the first enabled product', () => {
  const types = selectablePhotoTypes({ template_types: [
    { id: 11, customization_type: '彩印喷墨', is_active: true, name: '冰箱贴' },
    { id: 12, customization_type: '彩印喷墨', is_active: false, name: '旧模板' },
    { id: 13, customization_type: '光学激光', is_active: true, name: '军牌' },
  ] })
  assert.deepEqual(types.map(item => item.id), [11])
  assert.equal(keepSelectedPhotoType(types, null), null)
  assert.equal(keepSelectedPhotoType(types, 11), 11)
  assert.equal(keepSelectedPhotoType(types, 12), null)
})

test('formal long IDs cannot be rounded into a different product or sent to quote', () => {
  assert.throws(() => selectablePhotoTypes({ template_types: [
    { id: '793809887544066520', customization_type: '彩印喷墨' },
  ] }), /编号尚未对接/)
  assert.deepEqual(selectablePhotoTypes({ template_types: [
    { id: '31', customization_type: '彩印喷墨' },
  ] }).map(item => item.id), [31])
  assert.throws(() => selectablePhotoTypes({ template_types: null }), /格式不匹配/)
})
