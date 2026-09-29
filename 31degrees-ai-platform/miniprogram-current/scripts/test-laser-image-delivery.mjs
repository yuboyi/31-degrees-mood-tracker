import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateLaserImages, laserImagesReady, rasterUploadExtension, validateRasterDownload } from '../src/utils/laserImageDelivery.mjs'

function fixture(overrides = {}) {
  const calls = []
  return {
    calls,
    processing: {
      async depthMap() { calls.push('depth'); return { depth_url: '/gray.png' } },
      async bmp(url) { calls.push('bmp'); assert.equal(url, '/gray.png'); return { bmp_url: '/gray.bmp' } },
      async pod3d() { calls.push('preview'); return { output_url: '/preview.png' } },
      async zAxis25d() { assert.fail('File delivery must not generate machine commands') },
      async gcode() { assert.fail('File delivery must not generate machine commands') },
      ...overrides,
    },
  }
}

test('H5 blob paths use the selected file name while native paths remain supported', () => {
  assert.equal(rasterUploadExtension({name:'gray.PNG'}, 'blob:http://localhost/random'), 'png')
  assert.equal(rasterUploadExtension({type:'image/png'}, 'blob:http://localhost/random'), 'png')
  assert.equal(rasterUploadExtension({}, 'wxfile://tmp/image.jpg'), 'jpg')
  assert.equal(rasterUploadExtension({name:'malformed.exe',type:'image/png'}, 'blob:http://localhost/random'), '')
})

test('HTML and mismatched formats cannot be downloaded as PNG/BMP', () => {
  const png = new Uint8Array(33)
  png.set([137,80,78,71,13,10,26,10])
  validateRasterDownload(png.buffer, 'png')
  assert.throws(() => validateRasterDownload(png.buffer, 'bmp'), /不是所选格式/)
  assert.throws(() => validateRasterDownload(new TextEncoder().encode('<html>login required, not an image</html>').buffer, 'png'), /不是所选格式/)
})

test('PNG/BMP completion does not require preview, STL, G-code or device callback', async () => {
  const f = fixture({ pod3d: async () => { throw new Error('preview unavailable') } })
  const result = await generateLaserImages({ ...f, imageUrl: '/photo.png', format: 'both' })
  assert.equal(laserImagesReady('both', result.pngUrl, result.bmpUrl), true)
  assert.match(result.previewWarning, /预览暂不可用/)
  assert.deepEqual(f.calls, ['depth', 'bmp'])
})

test('PNG-only selection does not call BMP conversion', async () => {
  const f = fixture()
  const result = await generateLaserImages({ ...f, imageUrl: '/photo.png', format: 'png' })
  assert.deepEqual(f.calls, ['depth', 'preview'])
  assert.equal(result.bmpUrl, '')
  assert.equal(laserImagesReady('png', result.pngUrl, result.bmpUrl), true)
  assert.equal(laserImagesReady('bmp', result.pngUrl, result.bmpUrl), false)
})

test('failed BMP retains the PNG output but cannot mark BMP delivery ready', async () => {
  const f = fixture({ bmp: async () => ({}) })
  const outputs = {}
  await assert.rejects(generateLaserImages({ ...f, imageUrl: '/photo.png', format: 'both',
    onOutput: output => Object.assign(outputs, output) }), /未生成 BMP/)
  assert.equal(outputs.pngUrl, '/gray.png')
  assert.equal(laserImagesReady('both', outputs.pngUrl, outputs.bmpUrl), false)
})

test('missing depth output fails without fabricated preview files', async () => {
  const f = fixture({ depthMap: async () => ({}) })
  await assert.rejects(generateLaserImages({ ...f, format: 'both' }), /未生成灰度 PNG/)
  assert.deepEqual(f.calls, [])
  assert.equal(laserImagesReady('both', '', '/gray.bmp'), false)
})

test('preview-only and legacy machine formats are never complete', async () => {
  assert.equal(laserImagesReady('both', '/gray.png', '/gray.bmp', true), false)
  assert.equal(laserImagesReady('stl', '/gray.png', '/gray.bmp'), false)
  await assert.rejects(generateLaserImages({ ...fixture(), format: 'stl' }), /不支持/)
})

test('normalizes URLs and keeps the preview separate from the depth image', async () => {
  const f = fixture({ bmp: async url => {
    assert.equal(url, 'https://example.test/gray.png')
    return { bmp_url: '/gray.bmp' }
  }, pod3d: async () => ({ depth_url: '/gray.png' }) })
  const outputs = {}
  const result = await generateLaserImages({ ...f, format: 'both',
    normalizeUrl: value => value ? `https://example.test${value}` : '',
    onOutput: output => Object.assign(outputs, output) })
  assert.equal(outputs.previewUrl, undefined)
  assert.match(result.previewWarning, /预览暂不可用/)
  assert.equal(result.bmpUrl, 'https://example.test/gray.bmp')
})

test('authored grayscale calls only authenticated import, never depth, BMP worker or 3D inference', async () => {
  const f = fixture({ importGray: async () => ({
    depth_url: '/import.png', bmp_url: '/import.bmp', is_ai: false, source: 'authored-grayscale-import'
  }) })
  const result = await generateLaserImages({ ...f, format: 'both', sourceKind: 'gray', imageUrl: '/owned.png' })
  assert.deepEqual(f.calls, [])
  assert.equal(laserImagesReady('both', result.pngUrl, result.bmpUrl), true)
  assert.match(result.previewWarning, /未重新推理/)
})

test('authored import failure never falls back to the depth model', async () => {
  const f = fixture({ importGray: async () => { throw new Error('color input rejected') } })
  await assert.rejects(generateLaserImages({ ...f, sourceKind: 'gray', format: 'both' }), /color input/)
  assert.deepEqual(f.calls, [])
})

test('incomplete or mislabelled authored results are rejected', async () => {
  for (const payload of [{ depth_url: '/a.png' }, { depth_url: '/a.png', bmp_url: '/a.bmp', is_ai: true }]) {
    const f = fixture({ importGray: async () => payload })
    await assert.rejects(generateLaserImages({ ...f, sourceKind: 'gray', format: 'both' }), /来源不匹配/)
  }
})
