import assert from 'node:assert/strict'
import { serverImagePath, resultImageUrl, createImageJobGate } from '../src/utils/editorAiFlow.mjs'

const api = 'http://127.0.0.1:8000/api'
const path = '/uploads/202609/u905/' + 'a'.repeat(32) + '.png'
assert.equal(serverImagePath('http://127.0.0.1:8000' + path, api), path)
for (const value of ['wxfile://tmp/x.png', 'blob:x', 'http://evil.test' + path, '/uploads/../private']) {
  assert.equal(serverImagePath(value, api), null)
}
assert.equal(resultImageUrl({ logo_url:path, mask_url:'/wrong-mask' }, 'cutout', api), 'http://127.0.0.1:8000' + path)
assert.throws(() => resultImageUrl({ mask_url:path }, 'cutout', api), /有效效果图/)
assert.throws(() => resultImageUrl({ svg_url:'<svg />' }, 'vector', api), /有效效果图/)
const gate=createImageJobGate()
let finish, calls=0
const first=gate.run('old', ()=>new Promise(resolve=>{finish=resolve}), async()=>{calls++;return 'old'})
assert.equal(await gate.run('duplicate',async()=>'',async()=>{calls++}),null)
gate.invalidate(); finish('uploaded')
assert.equal(await first,null)
assert.equal(calls,0)
let finishAI
const pending=gate.run('old',async()=>path,()=>new Promise(resolve=>{finishAI=resolve}))
await Promise.resolve()
gate.invalidate(); finishAI('late result')
assert.equal(await pending,null)
let failLate
const oldFailure=gate.run('old',async()=>path,()=>new Promise((_,reject)=>{failLate=reject}))
await Promise.resolve()
gate.invalidate(); failLate(new Error('old error'))
assert.equal(await oldFailure,null)
await assert.rejects(gate.run('failed',async()=>{throw new Error('upload failed')},async()=>{}),/upload failed/)
assert.equal(await gate.run('new',async()=>path,async()=> 'new result'),'new result')
console.log('PASS: scoped URLs, foreground selection, malformed result, duplicate click, stale upload/result, retry')
