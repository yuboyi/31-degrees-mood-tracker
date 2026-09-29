import assert from 'node:assert/strict'
import test from 'node:test'
import { loadCreativeCatalog } from '../src/utils/creativeCatalog.mjs'

test('enabled official catalog keeps long IDs and never reads local demo data', async () => {
  const typeId = 'admin:793809887544066520'
  const templateId = 'admin:793809887544066521'
  const api = {
    template: { officialCatalog: async () => ({ enabled: true, source: 'admin_snapshot',
      template_types: [{ id: typeId, image_url: 'https://ai.31du.com/file/model.png', is_active: true }],
      templates: [{ id: templateId, template_type_id: typeId, source: 'admin_snapshot', is_active: true }],
    }), list: () => { throw new Error('must not read local templates') } },
    templateTypes: { list: () => { throw new Error('must not read local types') } },
  }
  const catalog = await loadCreativeCatalog(api)
  assert.equal(catalog.types[0].id, typeId)
  assert.equal(catalog.templates[0].template_type_id, typeId)
  assert.equal(catalog.templates[0].id, templateId)
})

test('disabled official catalog retains the existing local directory', async () => {
  const api = {
    template: { officialCatalog: async () => ({ enabled: false }),
      list: async () => ({ templates: [{ id: 2, template_type_id: 1 }] }) },
    templateTypes: { list: async () => ({ template_types: [{ id: 1, is_active: true }] }) },
  }
  const catalog = await loadCreativeCatalog(api)
  assert.deepEqual(catalog.types.map(item => item.id), [1])
  assert.deepEqual(catalog.templates.map(item => item.id), [2])
})

test('broken official catalog fails closed instead of mixing sources', async () => {
  const api = {
    template: { officialCatalog: async () => ({ enabled: true, source: 'admin_snapshot',
      template_types: [{ id: 'admin:1' }],
      templates: [{ id: 'admin:2', template_type_id: 1, source: 'admin_snapshot' }],
    }), list: () => { throw new Error('must not fall back') } },
    templateTypes: { list: () => { throw new Error('must not fall back') } },
  }
  await assert.rejects(loadCreativeCatalog(api), /来源不一致/)
  api.template.officialCatalog = async () => { throw new Error('snapshot unavailable') }
  await assert.rejects(loadCreativeCatalog(api), /snapshot unavailable/)
})
