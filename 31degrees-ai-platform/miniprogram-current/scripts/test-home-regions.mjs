import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { regionRoute, templateIndustry } from '../src/utils/homeRegions.mjs'

test('home regions link to dedicated catalog scope and reject unsupported entries', () => {
  assert.equal(regionRoute('uv'), '/pages/creative/index?industry=uv')
  assert.equal(regionRoute('laser'), '/pages/creative/index?industry=laser')
  assert.equal(regionRoute('exhibition'), null)
  assert.equal(regionRoute('shop'), null)
})
test('backend type wins over conflicting legacy product flags; unknown is not UV', () => {
  const types = [{ id: 1, customization_type: '彩印喷墨' }, { id: 2, customization_type: '光学激光' }, { id: 3, customization_type: 'other' }]
  assert.equal(templateIndustry({ template_type_id: 1, product_type: 'laser' }, types), 'uv')
  assert.equal(templateIndustry({ template_type_id: 2, product_type: 'inkjet' }, types), 'laser')
  assert.equal(templateIndustry({ template_type_id: 3, product_type: 'inkjet' }, types), null)
  assert.equal(templateIndustry({}, types), null)
  assert.equal(templateIndustry({ product_type: 'inkjet' }, types), 'uv')
  assert.equal(templateIndustry({ product_type: 'laser' }, types), 'laser')
  assert.equal(templateIndustry({ template_type_id: 'admin:793809887544066520' },
    [{ id: 'admin:793809887544066520', customization_type: '彩印喷墨' }]), 'uv')
})
test('startup, tabs and literal navigation calls are consistent after removing laser tab', () => {
  const src = fileURLToPath(new URL('../src/', import.meta.url))
  const config = JSON.parse(readFileSync(path.join(src, 'pages.json'), 'utf8'))
  const pages = new Set(config.pages.map(page => '/' + page.path))
  const tabs = new Set(config.tabBar.list.map(page => '/' + page.pagePath))
  assert.equal(config.pages[0].path, 'pages/index/index')
  assert.deepEqual([...tabs], ['/pages/index/index', '/pages/my/my'])
  assert.equal(pages.size, config.pages.length)
  let checked = 0
  function walk(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const filename = path.join(dir, item.name)
      if (item.isDirectory()) { walk(filename); continue }
      if (!item.name.endsWith('.vue')) continue
      const source = readFileSync(filename, 'utf8')
      for (const match of source.matchAll(/uni\.(switchTab|navigateTo)\(\{\s*url:\s*['"]([^'"]+)['"]/g)) {
        const target = match[2].split('?')[0]
        assert.ok(pages.has(target), `${filename}: unregistered ${target}`)
        assert.equal(tabs.has(target), match[1] === 'switchTab', `${filename}: wrong navigation method for ${target}`)
        checked++
      }
    }
  }
  walk(path.join(src, 'pages'))
  assert.ok(checked > 10)
})
