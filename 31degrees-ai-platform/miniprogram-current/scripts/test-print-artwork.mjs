import assert from 'node:assert/strict'
import { printArtworkPlan, drawPrintArtwork, effectivePhotoDpi, pngWithDpi } from '../src/utils/printArtwork.mjs'

const shirt = {source:'admin_snapshot',source_record_id:'793809887544066520',is_active:true,product_type:'inkjet',
  preview_ready:true,print_area:{x:.3,y:.3,width:.4,height:.5},shape:'rectangle',width_cm:20,height_cm:25,dpi:300,price_cents:0}
const plan = printArtworkPlan(shirt)
assert.deepEqual([plan.width,plan.height,plan.widthMm,plan.heightMm],[2362,2953,200,250])
for(const change of [{is_active:false},{product_type:'laser'},{width_cm:null},{dpi:null},{overlay_url:'mask.png'},
  {bezier_controls:[null,null,null,null]},{width_cm:100},{source:'local'},{price_cents:1},{price_cents:null}]) {
  assert.throws(()=>printArtworkPlan({...shirt,...change}))
}
assert.throws(()=>printArtworkPlan(shirt,'back'))
assert.equal(printArtworkPlan({...shirt,back_print_area:shirt.print_area},'back').side,'back')
const photo={width:320,height:400,tag:'customer-photo'}
const calls=[]
const ctx = new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true})
drawPrintArtwork(ctx,shirt,plan,photo,{zoom:1,rotation:0,offsetX:0,offsetY:0})
assert.equal(calls.filter(x=>x[0]==='drawImage').length,1)
assert.equal(calls.find(x=>x[0]==='drawImage')[1],photo)
assert.equal(calls.filter(x=>x[0]==='fillRect').length,0,'Photo transparency must not be filled with the product/background')
assert.ok(effectivePhotoDpi(plan,photo)<150,'Upscaling must warn about source resolution')
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=','base64')
const once=pngWithDpi(png,300), twice=pngWithDpi(once,300)
assert.deepEqual(once,twice,'DPI updates must replace rather than accumulate chunks')
const index=Buffer.from(once).indexOf('pHYs')
assert.equal(new DataView(once.buffer).getUint32(index+4),11811)
assert.equal(new DataView(once.buffer).getUint32(index+8),11811)
assert.equal(once[index+12],1)
assert.throws(()=>pngWithDpi(png.subarray(0,20),300))
assert.throws(()=>pngWithDpi(png,0))
console.log('PASS: physical dimensions, missing calibration, back-side guard, photo-only render, low resolution warning, PNG DPI integrity')
