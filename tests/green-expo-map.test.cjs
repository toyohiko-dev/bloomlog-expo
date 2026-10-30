/* eslint-disable @typescript-eslint/no-require-imports -- Public-source projection and synthetic records; no database or geolocation. */
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');
const source=JSON.parse(fs.readFileSync('lib/green-expo-source-data.json','utf8')),map=JSON.parse(fs.readFileSync('lib/green-expo-map-anchors.json','utf8')),rows=JSON.parse(fs.readFileSync('supabase/green-expo-facilities.rows.review.json','utf8')),bindings=JSON.parse(fs.readFileSync('lib/green-expo-reviewed-bindings.json','utf8'));const artwork={href:'/art/green-expo-places-v1.svg',width:100,height:125,viewBox:'0 0 100 125'};
function load(file,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,URLSearchParams,require:id=>{assert(id in deps,id);return deps[id];}});return exports;}
const model=load('lib/memory-map.ts'),symbols=load('lib/memory-map-symbols.ts');
const demo=load('lib/green-expo-demo.ts',{'./green-expo-source-data.json':source,'./green-expo-reviewed-bindings.json':bindings,'./green-expo-map':{greenExpoMapAnchors:map.anchors}}).createGeographicMemoryDemo;
const presentation=load('app/collection-next/illustrated-memory-map.tsx',{'@/lib/green-expo-map':{GREEN_EXPO_MAP_ART:artwork},'./venue-map-frame':{},'./venue-map-export':{},'react/jsx-runtime':{}});
test('189 anchors and 27 explicitly unmapped places exhaust the 216 reviewed IDs without source-name inference',()=>{assert.equal(map.anchors.length,189);assert.equal(map.unmapped.length,27);assert.equal(new Set([...map.anchors.map(a=>a.pavilionId),...map.unmapped.map(a=>a.pavilionId)]).size,216);for(const a of map.anchors){assert(rows.some(r=>r.id===a.pavilionId&&r.source_id===a.sourceId));assert(a.x>=0&&a.x<=1&&a.y>=0&&a.y<=1);assert.equal(a.productionApproved,false);assert.equal(a.uncertaintyMeters,null);assert(a.sourceUrl.startsWith('https://'));const p=source.places.find(p=>p.sourceId===a.sourceId);assert(p.gpsEnabled&&!p.coordinate.conflict);assert.equal(a.extrapolated,p.coordinate.extrapolated);}for(const a of map.unmapped){const p=source.places.find(p=>p.sourceId===a.sourceId);assert.equal(p.gpsEnabled,false);assert.equal(a.x,undefined);assert.equal(a.y,undefined);}assert.equal(map.anchors.filter(a=>['flower-20261009-p07-05','flower-20261009-p10-01'].includes(a.sourceId)).length,2);});
test('uniform projection preserves source position relationships and north rotation for every ID',()=>{const m=map.metadata,theta=m.rotationDegrees*Math.PI/180,R=m.earthRadiusMeters,[xmin,ymin,xmax,ymax]=m.rotatedBoundsMeters;for(const a of map.anchors){const c=source.places.find(p=>p.sourceId===a.sourceId).coordinate,e=R*(c.longitude-m.longitudeOrigin)*Math.PI/180*Math.cos(m.latitudeOrigin*Math.PI/180),n=R*(c.latitude-m.latitudeOrigin)*Math.PI/180,x=e*Math.cos(theta)-n*Math.sin(theta),y=-(e*Math.sin(theta)+n*Math.cos(theta));assert(Math.abs(a.x*100-(50+(x-(xmin+xmax)/2)*m.unitsPerMeter))<1e-8);assert(Math.abs(a.y*125-(65+(y-(ymin+ymax)/2)*m.unitsPerMeter))<1e-8);}const svg=fs.readFileSync('public/art/green-expo-places-v1.svg','utf8');assert.doesNotMatch(svg,/<image\b|href="https?:|data:image/i);assert.match(svg,/rotate\(-50\)/);assert.match(svg,/象徴表現/);assert.equal(m.originalDiagramImagesCopied,false);});
test('photo/flower layout retains IDs, counts and places across date filtering and master reordering',()=>{const d=demo();const all=model.buildMemoryMap(d.logs,d.sessions);const previews=new Map(d.logs.filter(l=>l.pavilion_id).map(l=>[l.pavilion_id,l.photo_path]));const a=presentation.buildIllustratedMarkers(d.pavilions,all.places,previews,false,map.anchors,artwork,true),b=presentation.buildIllustratedMarkers(d.pavilions.slice().reverse(),all.places,previews,false,map.anchors,artwork,true);assert.equal(a.length,189);for(const p of a){const q=b.find(q=>q.id===p.id);assert.equal(p.x,q.x);assert.equal(p.y,q.y);assert.equal(p.bloom,q.bloom);assert.equal(p.paperMemory,true);}const hero=bindings.find(b=>b.sourceId==='organizer-hanameguri').pavilionId;assert.equal(a.find(p=>p.id===hero).memoryCount,8);assert.equal(a.find(p=>p.id===hero).memoryDayCount,2);assert(a.find(p=>p.id===hero).previewUrl);const day=model.buildMemoryMap(d.logs,d.sessions,'2027-04-10');assert.equal(day.places.find(p=>p.id===hero).entries.length,5);assert.equal(day.places.find(p=>p.id===hero).entries.filter(l=>l.activity_type==='food').length,4);assert(d.logs.some(l=>l.pavilion_id&&!map.anchors.some(a=>a.pavilionId===l.pavilion_id)));const related=bindings.find(b=>b.sourceId==='public-ur').pavilionId;assert.equal(a.find(p=>p.id===related).visited,false);});
test('symbol separation is deterministic and never changes geographic anchors or drops dense records',()=>{const input=Array.from({length:40},(_,i)=>({id:`record-place-${i}`,x:300+(i%4),y:400+(i%3),radius:30}));const original=JSON.stringify(input);const a=symbols.separateMemorySymbols(input,{left:0,top:0,right:700,bottom:900}),b=symbols.separateMemorySymbols(input.slice().reverse(),{left:0,top:0,right:700,bottom:900});assert.equal(a.length,40);assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(JSON.stringify(input),original);assert(a.every(p=>p.anchorX===input.find(q=>q.id===p.id).x&&p.anchorY===input.find(q=>q.id===p.id).y));assert(a.some(p=>p.x!==p.anchorX));});
test('return destination is same-origin and carries selected event/place/day without accepting arbitrary URLs',()=>{const nav=load('lib/memory-map-navigation.ts');const href=nav.memoryMapReturnHref('expo','place','2027-04-10');const u=new URL(href,'http://localhost');assert.equal(u.pathname,'/collection-next');assert.equal(u.searchParams.get('place'),'place');assert.equal(u.searchParams.get('day'),'2027-04-10');assert(nav.memoryMapReturnHref('https://bad.example','//bad','invalid').startsWith('/collection-next?'));});


test('read-only preview uses the same unique place names as inactive production rows, including separate exhibitor plots',()=>{const d=demo();for(const p of d.pavilions){const row=rows.find(r=>r.id===p.id);assert.equal(p.name,row.name);assert.equal(p.official_name,row.official_name);}assert.equal(new Set(d.pavilions.map(p=>p.name)).size,216);});


test('location-deferred saves return directly to a specific record or the unplaced section',()=>{const nav=load('lib/memory-map-navigation.ts');assert(nav.memoryMapReturnHref(source.eventId,null,'2027-04-10','saved-record').endsWith('#memory-entry-saved-record'));assert(nav.memoryMapReturnHref(source.eventId,null,'2027-04-10').endsWith('#unplaced-memories'));assert(nav.memoryMapReturnHref(source.eventId,'place','2027-04-10','saved-record').includes('place=place'));});


test('published binding is limited to the one approved place while other prepared IDs stay unavailable',()=>{
 const {placeRegistry}=load('lib/place-coordinate-catalog.ts',{'./green-expo-map':{greenExpoMapAnchors:map.anchors},'./green-expo-reviewed-bindings.json':bindings,'./green-expo-pending-pavilion-ids.json':JSON.parse(fs.readFileSync('lib/green-expo-pending-pavilion-ids.json','utf8'))});
 assert.equal(placeRegistry.places.length,1);assert.equal(placeRegistry.anchors.length,1);
 assert.equal(placeRegistry.places[0].pavilionId,'6d66171a-a4d3-5395-bdc0-e1b4121e9b60');
 assert.equal(placeRegistry.places[0].sourceId,'organizer-hanameguri');
 assert.equal(placeRegistry.places[0].completionEligible,false);
 assert.equal(placeRegistry.anchors[0].productionApproved,false);
 assert(placeRegistry.pendingPavilionIds.length>=216);
});


test('bare map defaults to GREEN while explicit legacy and session destinations preserve their scope',()=>{
 const nav=load('lib/memory-map-navigation.ts');const events=[{id:nav.GREEN_EXPO_EVENT_ID},{id:'other'}];
 assert.equal(nav.resolveMemoryMapEvent(undefined,events),nav.GREEN_EXPO_EVENT_ID);assert.equal(nav.resolveMemoryMapEvent('unclassified',events),null);assert.equal(nav.resolveMemoryMapEvent('other',events),'other');assert.equal(nav.resolveMemoryMapEvent(undefined,[]),null);
 const legacy=new URL(nav.memoryMapReturnHref(null,null,'2027-05-12'),'https://example.invalid');assert.equal(legacy.searchParams.get('event'),'unclassified');assert.equal(legacy.searchParams.get('day'),'2027-05-12');
});

test('venue context is independently drawn from the same registered page and never shifts facility anchors',()=>{
 const base=JSON.parse(fs.readFileSync('lib/green-expo-basemap.json','utf8'));assert.equal(base.page,1);assert.equal(base.basePlanAsOf,'2025-09');assert.deepEqual(base.registrationSize,[1684,1190]);assert.equal(base.landmarks.filter(p=>p.kind==='gate').length,1);assert(base.river.length>2);assert(base.paths.length>2);
 const svg=fs.readFileSync('public/art/green-expo-places-v1.svg','utf8');for(const name of ['メインゲート','相沢川','シンボルガーデン','はなめぐり'])assert(svg.includes(name));assert(svg.includes('registered-venue-base'));assert.doesNotMatch(svg,/<image\b|data:image|href="https?:/i);
});


test('map photo entry follows the currently selected visit day, including empty days, and navigation starts at the map',()=>{
 const nav=load('lib/memory-map-navigation.ts');const days=[{id:'may',visit_date:'2027-05-12'},{id:'april',visit_date:'2027-04-10'}];
 assert.equal(nav.memoryMapPhotoEntryHref(days,'expo','2027-04-10'),'/sessions/april/activities/new?return=map#photo');
 assert.equal(nav.memoryMapPhotoEntryHref(days,'expo','2027-05-12'),'/sessions/may/activities/new?return=map#photo');
 const create=new URL(nav.memoryMapPhotoEntryHref([],'expo','2027-04-10'),'https://example.invalid');assert.equal(create.searchParams.get('event'),'expo');assert.equal(create.searchParams.get('visitDate'),'2027-04-10');
 assert.equal(new URL(nav.memoryMapHref('expo','2027-04-10'),'https://example.invalid').hash,'');assert(nav.memoryMapReturnHref(null,null,'2027-04-10').endsWith('#unplaced-memories'));
});


test('one saved photo is visible on the cumulative map and related goods never become a visit',()=>{
 const d=demo();const record=d.logs.find(l=>l.pavilion_id&&l.activity_type==='pin');const all=model.buildMemoryMap([record],d.sessions);const previews=new Map([[record.pavilion_id,'/art/demo-food.svg']]);const markers=presentation.buildIllustratedMarkers(d.pavilions,all.places,previews,false,map.anchors,artwork,true);const photo=markers.find(m=>m.id===record.pavilion_id);assert.equal(photo.previewUrl,'/art/demo-food.svg');assert.equal(photo.visited,false);assert.equal(photo.memoryCount,1);
});

test('all-days photo entry explicitly retains cumulative map scope',()=>{const nav=load('lib/memory-map-navigation.ts');const url=new URL(nav.memoryMapPhotoEntryHref([{id:'day',visit_date:'2027-04-10'}],'expo',null),'https://example.invalid');assert.equal(url.searchParams.get('mapDay'),'all');});
