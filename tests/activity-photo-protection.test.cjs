/* eslint-disable @typescript-eslint/no-require-imports -- Synthetic byte/authorization fixtures; no network or database. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,deps={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,File,Blob,Response,WeakMap,Promise,Uint8Array,DataView,Error,require:id=>{assert(id in deps,id);return deps[id];},...globals});return exports;}
const png=load('lib/png-metadata.ts');
const safe=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+afoQAAAAASUVORK5CYII=','base64');
function preparation(options={}){
 const calls=[];const canvas={width:0,height:0,getContext:()=>options.noContext?null:{drawImage:(...args)=>{calls.push('draw');canvas.drawnSize=args.slice(-2);}},toBlob:fn=>fn(options.noBlob?null:new Blob([options.metadata?Buffer.concat([safe.subarray(0,safe.length-12),Buffer.from([0,0,0,1,116,69,88,116,88,0,0,0,0]),safe.subarray(safe.length-12)]):safe],{type:'image/png'}))};
 const result=load('lib/prepare-activity-photo.ts',{'./png-metadata':png,'./photo-metadata':{readPhotoGps:async()=>{calls.push('gps-local');return null;}}},{createImageBitmap:options.decodeFail?async()=>{throw Error();}:async(_file,opts)=>{calls.push(opts.imageOrientation);return {width:options.width??2,height:options.height??3,close:()=>calls.push('close')};},document:{createElement:()=>canvas}});
 return {...result,calls,canvas};
}
test('upload encoding reads GPS locally then draws oriented pixels and emits only inspected PNG',async()=>{
 const h=preparation();const original=new File(['GPS EXIF original'],'camera.jpg',{type:'image/jpeg'});
 const photo=await h.prepareActivityPhoto(original);
 assert.equal(photo.type,'image/png');assert.equal(photo.name,'memory.png');assert.notEqual(photo,original);
 assert.deepEqual(h.calls,['gps-local','from-image','draw','close']);
 assert.equal((await png.checkGeneratedPng(photo)).locationMetadataContainers.length,0);
 assert.equal(await original.text(),'GPS EXIF original');
 assert.equal(await h.prepareActivityPhoto(original),photo);assert.equal(h.calls.length,4);
});
test('unsupported/failed/oversize or metadata-bearing conversion never returns original bytes',async()=>{
 for(const options of [{decodeFail:true},{noContext:true},{noBlob:true},{width:50000,height:50000},{metadata:true}]){
  const h=preparation(options);await assert.rejects(h.prepareActivityPhoto(new File(['raw'],'raw.jpg',{type:'image/jpeg'})),/写真/);
 }
 const h=preparation();await assert.rejects(h.prepareActivityPhoto(new File(['heic'],'raw.heic',{type:'image/heic'})),/写真/);assert.equal(h.calls.length,0);
});
test('output dimensions are bounded and failed encoding can be retried',async()=>{
 const h=preparation({width:6000,height:3000});
 await h.prepareActivityPhoto(new File(['raw'],'raw.webp',{type:'image/webp'}));
 assert.deepEqual(h.canvas.drawnSize,[4096,2048]);assert.equal(h.canvas.width,0);assert.equal(h.canvas.height,0);
 const options={noBlob:true},retry=preparation(options),file=new File(['raw'],'retry.png',{type:'image/png'});await assert.rejects(retry.prepareActivityPhoto(file));options.noBlob=false;assert.equal((await retry.prepareActivityPhoto(file)).type,'image/png');
});
test('server rejects original JPEG and metadata-bearing PNG instead of trusting the client',async()=>{
 const {assertPreparedActivityPhoto}=load('lib/activity-photo-upload.ts',{'./png-metadata':png});
 await assertPreparedActivityPhoto(new File([safe],'safe.png',{type:'image/png'}));
 await assert.rejects(assertPreparedActivityPhoto(new File(['GPS'],'raw.jpg',{type:'image/jpeg'})));
 await assert.rejects(assertPreparedActivityPhoto(new File(['not png'],'fake.png',{type:'image/png'})));
});
const {activityPhotoResponse}=load('lib/activity-photo-response.ts');
function client(options={}){
 const calls=[];const query={select(){return this;},eq(key,value){calls.push([key,value]);return this;},limit(){return this;},async maybeSingle(){return {data:options.missing?null:{photo_path:options.path??'owner/day/photo.png'},error:options.queryError?{}:null};}};
 return {calls,auth:{getUser:async()=>{calls.push('auth');return {data:{user:options.anonymous?null:{id:'owner'}},error:null};}},from:()=>{calls.push('record');return query;},storage:{from:()=>({download:async path=>{calls.push(['download',path]);return {data:options.storageError?null:new Blob([safe],{type:options.type??'image/png'}),error:options.storageError?{}:null};}})}};
}
test('photo response authenticates, verifies owned reference, and streams without public/signed URL or cache',async()=>{
 const c=client();for(let i=0;i<2;i++){const r=await activityPhotoResponse(c,'12345678-1234-4123-8123-123456789abc');assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store, max-age=0');assert.equal(r.headers.get('vary'),'Cookie');assert.equal(r.headers.get('content-type'),'image/png');assert.equal((await r.arrayBuffer()).byteLength,safe.length);}
 assert.equal(c.calls.filter(x=>x==='auth').length,2);assert.equal(c.calls.filter(x=>Array.isArray(x)&&x[0]==='download').length,2);
});
test('anonymous, another owner, traversal, missing reference and failed storage fail closed',async()=>{
 const anon=client({anonymous:true});assert.equal((await activityPhotoResponse(anon,'12345678-1234-4123-8123-123456789abc')).status,401);assert(!anon.calls.includes('record'));
 for(const path of ['other/day/photo.png','owner/../secret',null,'owner\\day\\x']){const c=client();assert.equal((await activityPhotoResponse(c,path)).status,404);assert(!c.calls.includes('record'));}
 for(const options of [{missing:true},{queryError:true},{storageError:true},{type:'image/svg+xml'}])assert.equal((await activityPhotoResponse(client(options),'12345678-1234-4123-8123-123456789abc')).status,404);
});


test('owned record resolves its path internally; forged storage paths and other-record IDs cannot bypass ownership',async()=>{
 const id='12345678-1234-4123-8123-123456789abc';
 const own=client();const response=await activityPhotoResponse(own,id);
 assert.equal(response.status,200);assert(own.calls.some(c=>Array.isArray(c)&&c[0]==='user_id'&&c[1]==='owner'));assert(own.calls.some(c=>Array.isArray(c)&&c[0]==='id'&&c[1]===id));
 for(const path of ['other/day/photo.png','owner/../photo.png','owner//photo.png','owner/day/%2e%2e.jpg','owner/day/https:evil.jpg','owner/day/x\\u0000.png']){
  const c=client({path});const r=await activityPhotoResponse(c,id);assert.equal(r.status,404);assert.equal(await r.text(),'');assert(!c.calls.some(c=>Array.isArray(c)&&c[0]==='download'));
 }
 for(const value of ['https://example.invalid/image.png','owner/day/photo.png','../x',id+'?path=other',null]){const c=client();assert.equal((await activityPhotoResponse(c,value)).status,404);assert(!c.calls.includes('record'));}
 const other=client({missing:true});const r=await activityPhotoResponse(other,id);assert.equal(r.status,404);assert.equal(await r.text(),'');assert(!other.calls.some(c=>Array.isArray(c)&&c[0]==='download'));
});

function metadataChunk(type,payload=Buffer.from('synthetic metadata')){
 const chunk=Buffer.alloc(payload.length+12);chunk.writeUInt32BE(payload.length);chunk.write(type,4);payload.copy(chunk,8);return chunk;
}
test('server inspects bytes and rejects EXIF/XMP/text PNG containers, trailing data and disguised JPEG',async()=>{
 const {assertPreparedActivityPhoto}=load('lib/activity-photo-upload.ts',{'./png-metadata':png});
 for(const type of ['eXIf','iTXt','tEXt','zTXt','caBX','xMPx']){
  const bytes=Buffer.concat([safe.subarray(0,safe.length-12),metadataChunk(type),safe.subarray(safe.length-12)]);
  await assert.rejects(assertPreparedActivityPhoto(new File([bytes],'safe.png',{type:'image/png'})));
 }
 await assert.rejects(assertPreparedActivityPhoto(new File([Buffer.from([255,216,255,225,0,8]),Buffer.from('Exif GPS')],'forged.png',{type:'image/png'})));
 await assert.rejects(assertPreparedActivityPhoto(new File([safe,Buffer.from('GPS')],'trailing.png',{type:'image/png'})));
});


test('photo browser URL contains only record ID and never requires a public Storage URL',()=>{
 const {getActivityPhotoUrl}=load('lib/supabase/shared.ts',{'@supabase/supabase-js':{createClient(){throw Error('not needed');}}});
 const url=getActivityPhotoUrl('12345678-1234-4123-8123-123456789abc');
 assert.equal(url,'/api/activity-photo?id=12345678-1234-4123-8123-123456789abc');assert(!url.includes('storage'));assert(!url.includes('supabase'));
});
test('unexpected storage/auth errors return generic empty non-cacheable response without details',async()=>{
 const c=client();c.auth.getUser=async()=>{throw Error('private backend URL and token');};
 const response=await activityPhotoResponse(c,'12345678-1234-4123-8123-123456789abc');
 assert.equal(response.status,503);assert.equal(await response.text(),'');assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
});
test('review SQL adds only authenticated owner-record SELECT and is inert by default',()=>{
 const sql=fs.readFileSync('supabase/migrations/20261025214835_prepare_activity_photo_owner_record_read.sql','utf8');const pending=fs.readFileSync('supabase/activity-photo-private.review.sql','utf8');
 assert.match(sql,/for select to authenticated/i);assert.match(sql,/a\.user_id=\(select auth\.uid\(\)\)/);assert.match(sql,/a\.photo_path=storage\.objects\.name/);assert.match(sql,/storage\.foldername\(name\)/);assert.match(pending,/rollback;/i);assert(!/create policy|public=true\s*where/i.test(pending));assert(!/\bgrant\b|\bto\s+anon\b|\bdrop\s+policy\b/i.test(sql));
});
