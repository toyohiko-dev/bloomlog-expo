/* eslint-disable @typescript-eslint/no-require-imports -- Test the browser renderer without extra packages or network access. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const symbols={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/memory-map-symbols.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:symbols});
function renderer(options = {}) {
  const texts = [], revoked = [], attributes = {}, drawing = [], requests = [];
  let imageUrl;
  const ctx = new Proxy({
    measureText: (text) => ({ width: Array.from(text).length * 12 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    fillText: (text) => texts.push(text),
  }, { get(target, key) { return target[key] ?? ((...args) => drawing.push([key, ...args])); }, set(target, key, value) { target[key] = value; return true; } });
  const canvas = { width: 0, height: 0, getContext: () => options.noCanvas ? null : ctx,
    toBlob: (callback) => callback(options.noBlob ? null : new Blob(['png'], { type: 'image/png' })) };
  const source = { cloneNode() { return {
    setAttribute: (name, value) => { attributes[name] = value; }, removeAttribute() {},
    querySelector: () => options.noBase ? null : { setAttribute: (name, value) => { attributes['image-' + name] = value; } },
  }; } };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('app/collection-next/venue-map-image.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, {
    exports, Blob, Intl, Date, Promise, setTimeout, clearTimeout, AbortSignal,
    require: name => name==='@/lib/memory-map-symbols'?symbols:({ VENUE_MAP_ASSET: { href: '/prototypes/venue-map-zones.png', width: 100, height: 67 } }),
    document: { fonts: { ready: Promise.resolve() }, createElement: () => canvas },
    fetch: async (url,init) => {requests.push({url,init});if(options.fetchHook){const response=await options.fetchHook(url,init,requests);if(response)return response;}return { ok: !options.networkError&&!(options.coverError&&url==='/cover.jpg')&&!(options.coverUnauthorized&&url.startsWith('/api/activity-photo?')), blob: async () => new Blob(['base']) };},
    FileReader: class { readAsDataURL() { this.result = 'data:image/png;base64,YmFzZQ=='; this.onload(); } },
    XMLSerializer: class { serializeToString() { return '<svg/>'; } },
    Image: class { set src(url) { imageUrl = url; queueMicrotask(() => options.imageError ? this.onerror() : this.onload()); } },
    URL: { createObjectURL: () => 'blob:test-map', revokeObjectURL: (url) => revoked.push(url) },
  });
  return { ...exports, canvas, texts, revoked, attributes, drawing, requests, source, get imageUrl() { return imageUrl; } };
}

function marker(id, visited, name = id) {
  return { id, name, visited, x: 40, y: 20, rotation: 0, bloom: '#16a34a', areaName: 'East Garden', visitCount: 3 };
}

test('counts unique visited pavilions, handles zero and keeps visit count separate', () => {
  const r = renderer();
  const summary = r.getMapImageSummary([marker('a', true), marker('a', true), marker('b', false)]);
  assert.equal(summary.total, 2); assert.equal(summary.visited.length, 1); assert.equal(summary.percentage, 50);
  assert.equal(r.getMapImageSummary([]).percentage, 0);
});

test('crowded flowers separate without changing their original map anchors', () => {
  const r = renderer();
  const points = r.getMapImagePositions([marker('a', true), marker('b', true)]);
  assert(Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) >= 75);
  assert.equal(points[0].anchorX, points[1].anchorX);
  assert.equal(points[0].marker.x, 40);
});

test('PNG composition includes full map, Japanese names, area, count, flowers and no controls', async () => {
  const r = renderer();
  const blob = await r.createVenueMapImage(r.source, [marker('a', true, '庭園パビリオン'), marker('b', false)]);
  assert.equal(blob.type, 'image/png'); assert.equal(r.canvas.width, 1800);
  assert(r.canvas.height > 1400); assert.equal(r.attributes.width, '1712');
  assert.match(r.attributes['image-href'], /^data:image\/png/);
  assert(r.texts.includes('1 / 2 訪問済み')); assert(r.texts.includes('庭園パビリオン'));
  assert(r.texts.includes('East Garden · 3回')); assert(r.texts.includes('達成率 50%'));
  assert(!r.texts.some((text) => /画像を保存|全体|画像を共有/.test(text)));
  assert.equal(r.drawing.filter(([name]) => name === 'ellipse').length, 8);
  assert.deepEqual(r.revoked, ['blob:test-map']);
});

test('empty and large collections render truthfully within bounded canvas height', async () => {
  const empty = renderer(); await empty.createVenueMapImage(empty.source, []);
  assert(empty.texts.includes('0 / 0 訪問済み'));
  const many = renderer(); await many.createVenueMapImage(many.source, Array.from({ length: 30 }, (_, i) => marker(String(i), true)));
  assert(many.texts.includes('30 / 30 訪問済み'));
  assert(many.texts.some((text) => text.includes('ほか6件'))); assert(many.canvas.height < 2200);
});

test('essential map/image/canvas failures reject and revoke temporary image URLs', async () => {
  for (const option of ['noCanvas', 'networkError', 'noBase', 'imageError', 'noBlob']) {
    const r = renderer({ [option]: true });
    await assert.rejects(() => r.createVenueMapImage(r.source, [marker('a', true)]));
    if (option === 'imageError' || option === 'noBlob') assert.deepEqual(r.revoked, ['blob:test-map']);
  }
});

test('portrait artwork export keeps the full aspect ratio and count badges without flowers', async () => {
  const r = renderer();
  const asset = { href:'/art/memory-garden-v1.png',width:100,height:150,viewBox:'0 0 100 150' };
  const a = {...marker('a',true),memoryCount:123};
  await r.createVenueMapImage(r.source,[a],{asset,badgeMarkers:true,title:'2027-04-10の思い出'});
  assert.equal(r.attributes.height,'2568'); assert(r.canvas.height > 2800);
  assert(r.texts.includes('123')); assert(r.texts.includes('2027-04-10の思い出'));
  assert.equal(r.drawing.filter(([name])=>name==='ellipse').length,0);
  const p = r.getMapImagePositions([a],asset)[0];
  assert.equal(p.anchorY,166 + 20/150*2568);
});


test('geographic PNG draws photo stacks and flat flowers without implying official completion',async()=>{const r=renderer();const a={...marker('a',true),paperMemory:true,memoryCount:123,memoryDayCount:2,previewUrl:'/cover.jpg'};await r.createVenueMapImage(r.source,[a],{asset:{href:'/art/green-expo-places-v1.svg',width:100,height:125},memoryStyle:true});assert(r.texts.includes('思い出 123件'));assert(r.texts.includes('2日'));assert(!r.texts.some(s=>s.startsWith('達成率')));assert(r.drawing.filter(([op])=>op==='drawImage').length>=2);assert(r.drawing.some(([op])=>op==='bezierCurveTo'));});
test('missing photo prevents a silently incomplete export',async()=>{const r=renderer({coverError:true});await assert.rejects(()=>r.createVenueMapImage(r.source,[{...marker('a',true),paperMemory:true,memoryCount:14,previewUrl:'/cover.jpg'}],{memoryStyle:true}),/photo-unavailable/);assert.deepEqual(r.revoked,['blob:test-map']);});

test('private record photos in geographic PNG request same-origin cookies without caching or public-path fallback',async()=>{
 const r=renderer(),photo='/api/activity-photo?id=12345678-1234-4123-8123-123456789abc';
 await r.createVenueMapImage(r.source,[{...marker('private',true),paperMemory:true,memoryCount:8,memoryDayCount:2,previewUrl:photo}],{memoryStyle:true});
 const request=r.requests.find(x=>x.url===photo);assert(request);assert.equal(request.init.credentials,'same-origin');assert.equal(request.init.cache,'no-store');
 assert(!r.requests.some(x=>x.url.includes('/storage/v1/object/public/')));assert(r.texts.includes('思い出 8件'));
});
test('expired photo authentication blocks export without public URL fallback',async()=>{
 const r=renderer({coverUnauthorized:true});
 await assert.rejects(()=>r.createVenueMapImage(r.source,[{...marker('private',true),paperMemory:true,memoryCount:8,previewUrl:'/api/activity-photo?id=12345678-1234-4123-8123-123456789abc'}],{memoryStyle:true}),/photo-unavailable/);
 assert.equal(r.requests.filter(x=>x.url.startsWith('/api/activity-photo?')).length,1);assert(!r.requests.some(x=>x.url.includes('/storage/v1/object/public/')));
});

test('a temporary cover failure retries once and both photo thumbnails reach the PNG',async()=>{let first=0,omitted=0;const r=renderer({fetchHook:async url=>url==='/first.jpg'&&first++===0?{ok:false,status:503}:undefined});const markers=['first','second'].map(id=>({...marker(id,false),paperMemory:true,memoryCount:1,previewUrl:'/'+id+'.jpg'}));await r.createVenueMapImage(r.source,markers,{memoryStyle:true,onPhotosOmitted:n=>omitted=n});assert.equal(r.requests.filter(q=>q.url==='/first.jpg').length,2);assert.equal(r.requests.filter(q=>q.url==='/second.jpg').length,1);assert.equal(r.drawing.filter(([op])=>op==='drawImage').length,3);assert.equal(omitted,0);});
test('two photo requests start together so a slow first photo cannot block the second',async()=>{let firstRelease,secondStarted=false;const r=renderer({fetchHook:async url=>{if(url==='/slow.jpg')await new Promise(resolve=>{firstRelease=resolve;});if(url==='/fast.jpg'){secondStarted=true;firstRelease();}}});await r.createVenueMapImage(r.source,[{...marker('slow',false),paperMemory:true,memoryCount:1,previewUrl:'/slow.jpg'},{...marker('fast',false),paperMemory:true,memoryCount:1,previewUrl:'/fast.jpg'}],{memoryStyle:true});assert.equal(secondStarted,true);assert.equal(r.drawing.filter(([op])=>op==='drawImage').length,3);});
test('permanent missing or forbidden photos block incomplete output and are not retried',async()=>{for(const status of [401,403,404]){const r=renderer({fetchHook:async url=>url==='/missing.jpg'?{ok:false,status}:undefined});await assert.rejects(()=>r.createVenueMapImage(r.source,[{...marker('missing',false),paperMemory:true,memoryCount:1,previewUrl:'/missing.jpg'}],{memoryStyle:true}),/photo-unavailable/);assert.equal(r.requests.filter(q=>q.url==='/missing.jpg').length,1);}});

test('unplaced photo failures also prevent incomplete output',async()=>{const r=renderer({coverError:true});await assert.rejects(()=>r.createVenueMapImage(r.source,[],{memoryStyle:true,unplaced:[{id:'a',title:'Photo',date:null,previewUrl:'/cover.jpg'}]}),/photo-unavailable/);});

test('all-days image includes every unplaced memory without inventing map positions',async()=>{const r=renderer();await r.createVenueMapImage(r.source,[{...marker('placed',true),paperMemory:true,memoryCount:4}],{memoryStyle:true,unplaced:[{id:'older',title:'Older unplaced',date:'2027-04-10',previewUrl:'/older.jpg'},{id:'later',title:'Later unplaced',date:'2027-05-12',previewUrl:'/later.jpg'}]});assert(r.texts.includes('思い出 6件'));assert(r.texts.includes('Older unplaced'));assert(r.texts.includes('Later unplaced'));assert(r.texts.includes('2027-04-10'));assert(r.texts.includes('2027-05-12'));assert.equal(r.drawing.filter(([op])=>op==='drawImage').length,3);});


test('complete memory list includes mapped photos without double counting or a visit-only list',async()=>{
 const r=renderer();await r.createVenueMapImage(r.source,[{...marker('mapped',true),paperMemory:true,memoryCount:2,previewUrl:'/cover.jpg'}],{memoryStyle:true,memories:[{id:'first',title:'First food',date:'2027-04-10',previewUrl:'/one.jpg'},{id:'second',title:'Second food',date:'2027-05-12',previewUrl:'/two.jpg'},{id:'no-place',title:'No place',date:'2027-05-12',previewUrl:null}]});
 assert(r.texts.includes('思い出 3件'));assert(r.texts.includes('思い出一覧'));assert(r.texts.includes('First food'));assert(r.texts.includes('Second food'));
 assert(!r.texts.includes('訪れた場所の記録'));assert(!r.texts.some(t=>t.includes('場所はおおよそです')));
 assert.equal(r.drawing.filter(([op])=>op==='drawImage').length,4);
});
