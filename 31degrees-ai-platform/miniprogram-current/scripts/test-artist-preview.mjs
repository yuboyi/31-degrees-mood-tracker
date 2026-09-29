import assert from 'node:assert/strict'
import { previewRect, clipArtistArea, artistBounds } from '../src/utils/artistPreview.mjs'

const shirt = { preview_ready: true, print_area: { x: 179 / 595, y: 181 / 604.827648,
  width: 252 / 595, height: 316 / 604.827648 } }
const rect = previewRect(shirt, 595, 604.827648)
assert.equal(rect.x, 179)
assert.equal(rect.width, 252)
assert.throws(() => previewRect(shirt, 595, 605, 'back'), /打印区域/)
assert.throws(() => previewRect({ ...shirt, preview_ready: false }, 595, 605), /打印区域/)
const calls = []
const ctx = new Proxy({}, { get: (_, name) => (...args) => calls.push([name, ...args]) })
clipArtistArea(ctx, { shape: 'circle' }, { x: 20, y: 30, width: 100, height: 100 })
assert.deepEqual(calls.find(c => c[0] === 'translate'), ['translate', 70, 80])
assert.equal(calls.at(-1)[0], 'clip')
calls.length = 0
clipArtistArea(ctx, { shape: 'rectangle', bezier_controls: [{ x: 50, y: -30 }, null, null, null] },
  { x: 10, y: 20, width: 200, height: 300 })
assert.deepEqual(calls.find(c => c[0] === 'quadraticCurveTo'), ['quadraticCurveTo', 110, -70, 210, 20])
assert.deepEqual(artistBounds({ shape:'rectangle', bezier_controls:[{x:50,y:-30},null,null,null] },
  {x:10,y:20,width:200,height:300}), {x:10,y:-25,width:200,height:345})
console.log('artist preview: reference board, missing side, circle, quadratic curve passed')
