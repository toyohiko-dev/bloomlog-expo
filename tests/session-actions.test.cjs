/* eslint-disable @typescript-eslint/no-require-imports -- Isolated server action tests; no network or real storage. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => {
    if (!(name in mocks)) throw Error(`Unexpected dependency: ${name}`);
    return mocks[name];
  }, File, FormData, crypto: require('node:crypto').webcrypto, console: { warn() {} } });
  return exports;
}
const cleanup = load('lib/activity-photo-cleanup.ts', {}).cleanupUncommittedActivityPhoto;
const registryLogic=load('lib/place-registry.ts',{});
const sourceCatalog=JSON.parse(fs.readFileSync('lib/green-expo-source-data.json','utf8'));
const contextLogic=load('lib/place-context.ts',{});
const attemptLogic=load('lib/activity-save-attempt.ts',{});
test('cleanup never removes without an explicit RPC grant, including absent RPC', async () => {
  const calls = [];
  const c = { storage: { from: () => ({ remove() { calls.push('remove'); } }) } };
  for (const result of [{ data: false }, { data: true, error: Error('denied') }, { data: null, error: Error('RPC missing') }]) {
    c.rpc = async () => result;
    await cleanup(c, 'owner', 'owner/day/fresh.jpg');
  }
  delete c.rpc;
  await cleanup(c, 'owner', 'owner/day/fresh.jpg');
  assert.deepEqual(calls, []);
});
test('cleanup claims before remove and skips invalid ownership paths', async () => {
  const calls = []; const c = {
    rpc: async (name, args) => { calls.push([name, args.p_path]); return { data: true }; },
    storage: { from: bucket => ({ remove: async paths => { calls.push([bucket, ...paths]); return { error: null }; } }) },
  };
  for (const path of [null, 'other/day/a.jpg', 'owner/../a.jpg']) await cleanup(c, 'owner', path);
  assert.deepEqual(calls, []);
  await cleanup(c, 'owner', 'owner/day/a.jpg');
  assert.deepEqual(calls, [['claim_activity_photo_cleanup', 'owner/day/a.jpg'], ['activity-photos', 'owner/day/a.jpg']]);
});
function actions(errorTable, errorOperation, calls = [], options = {}) {
  const query = table => {
    let operation = 'read';
    const q = {
      insert(payload) { operation = 'insert'; calls.push('insert'); options.onWrite?.(table, payload); return this; }, update(payload) { operation = 'update'; calls.push('update'); options.onWrite?.(table, payload); return this; }, delete() { operation = 'delete'; calls.push('delete'); return this; },
      select() { return this; }, eq() { return this; }, is() { return this; }, or() { return this; },
      single() { return this; }, maybeSingle() { return this; },
      then(resolve, reject) {
        if (options.throwDB && operation === errorOperation) return reject(Error('offline'));
        resolve({ data: operation === 'delete' ? [{ photo_path: 'owner/day/deleted.jpg' }] : options.stale && operation === 'update' ? null : { id: 'event' }, error: table === errorTable && operation === errorOperation ? { message: 'private database detail',code:options.errorCode } : null });
      },
    }; return q;
  };
  return load('app/sessions/actions.ts', {
    '@/lib/activity-photo-upload':{assertPreparedActivityPhoto:async()=>{if(options.unsafePhoto)throw Error('unsafe');}},
    '@/lib/place-registry':registryLogic,
    '@/lib/place-context':contextLogic,
    '@/lib/activity-save-attempt':attemptLogic,
    '@/lib/green-expo-research':{greenExpoResearch:sourceCatalog},
    '@/lib/place-context-config':{placeContextStorageEnabled:options.contextEnabled===true},
    '@/lib/place-coordinate-catalog':{placeRegistry:options.registry??{events:[],places:[],anchors:[]}},
    'next/cache': { revalidatePath() {} }, 'next/navigation': { redirect() { throw Error('redirect'); } },
    '@/lib/auth': { requireUser: async () => ({ id: 'owner' }) },
    '@/lib/activity-photo-cleanup': { cleanupUncommittedActivityPhoto: cleanup },
    '@/lib/activity-types': { normalizeAcquisitionMethod: () => null },
    '@/lib/supabase/server': { createServerSupabaseClient: async () => ({ from: query,
      rpc: async (_name, args) => { calls.push(['claim', args.p_path]); return { data: options.claim !== false, error: options.rpcError ? Error('RPC missing') : null }; },
      storage: { from: () => ({ upload: async () => { calls.push('upload'); return { error: null }; }, remove: async paths => { calls.push(['remove', ...paths]); if (options.throwRemove) throw Error('offline'); return { error: options.removeError ? Error('denied') : null }; } }) } }) },
    '@/lib/supabase/shared': { createPublicSupabaseClient: () => ({ from: query }) },
    '@/lib/sessions': { listEvents:async()=>[{id:'event',name:'Event'}], getSessionByVisitDate: async () => options.existingSession??null, getDefaultEventId: async () => 'event',
      getPavilion: async id => id === 'missing' ? null : ({ id, name: 'Garden', is_active: options.inactivePavilion!==true }),
      getSession: async () => ({ visit_date: options.sessionDate??'2026-10-18', event_id: options.sessionEventId??'event' }),
      getActivityLog: async id => id!=='log'?(typeof options.submittedLog==='function'?options.submittedLog():options.submittedLog??null):({ place_context:options.originalContext??null,pavilion_id:options.originalPavilionId??null, session_id: 'day', photo_path: 'owner/day/old.jpg' }) },
  });
}
function form() { const f = new FormData(); for (const [key, value] of Object.entries({ id: 'day', sessionId: 'day', logId: 'log', visitDate: '2026-10-18', activityType: 'food', title: 'food' })) f.set(key, value); return f; }
test('create and update failures return readable Japanese without database detail', async () => {
  for (const [table, operation, name, expected] of [
    ['visit_sessions', 'insert', 'createSessionAction', '来場日の保存に失敗しました。'],
    ['visit_sessions', 'update', 'updateSessionAction', '来場日の保存に失敗しました。'],
    ['activity_logs', 'insert', 'submitActivityLogAction', '記録の保存に失敗しました。'],
    ['activity_logs', 'update', 'updateActivityLogAction', '記録の保存に失敗しました。'],
  ]) { const state = await actions(table, operation)[name](form()); assert.equal(state.status, 'error'); assert.equal(state.message, expected); }
});
test('delete failures throw readable Japanese', async () => {
  for (const [table, name] of [['activity_logs', 'deleteActivityLogAction'], ['activity_logs', 'deleteSessionAction'], ['visit_sessions', 'deleteSessionAction']]) {
    await assert.rejects(actions(table, 'delete')[name](form()), { message: '削除に失敗しました。' });
  }
});
test('failed insert and replacement reclaim only the new upload after DB failure', async () => {
  for (const [operation, action] of [['insert', 'submitActivityLogAction'], ['update', 'updateActivityLogAction']]) {
    const calls = []; const f = form(); f.set('photo', new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }));
    const result = await actions('activity_logs', operation, calls)[action](f);
    assert.equal(result.status, 'error');
    assert.deepEqual(calls.slice(0, 2), ['upload', operation]);
    assert.equal(calls[2][0], 'claim'); assert.equal(calls[3][0], 'remove');
    assert.equal(calls[2][1], calls[3][1]); assert.notEqual(calls[2][1], 'owner/day/old.jpg');
  }
});
test('successful replacement and deletion reclaim the replaced or actually deleted photo', async () => {
  const calls = []; const f = form(); f.set('photo', new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }));
  assert.equal((await actions(null, null, calls).updateActivityLogAction(f)).status, 'success');
  assert.deepEqual(calls, ['upload', 'update', ['claim', 'owner/day/old.jpg'], ['remove', 'owner/day/old.jpg']]);
  const deletes = []; await assert.rejects(actions(null, null, deletes).deleteActivityLogAction(form()), /redirect/);
  assert.deepEqual(deletes, ['delete', ['claim', 'owner/day/deleted.jpg'], ['remove', 'owner/day/deleted.jpg']]);
});
test('RPC and Storage failures do not turn committed updates into failed saves', async () => {
  for (const options of [{ claim: false }, { rpcError: true }, { removeError: true }, { throwRemove: true }]) {
    const calls = []; const f = form(); f.set('photo', new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }));
    assert.equal((await actions(null, null, calls, options).updateActivityLogAction(f)).status, 'success');
    if (options.claim === false || options.rpcError) assert.equal(calls.some(c => Array.isArray(c) && c[0] === 'remove'), false);
  }
});
test('stale or thrown database failures never reclaim the current old photo', async () => {
  for (const options of [{ stale: true }, { throwDB: true }]) {
    const calls = []; const f = form(); f.set('photo', new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }));
    assert.equal((await actions(null, 'update', calls, options).updateActivityLogAction(f)).status, 'error');
    assert.equal(calls.some(c => Array.isArray(c) && c[1] === 'owner/day/old.jpg'), false);
    assert.equal(calls.filter(c => Array.isArray(c) && c[0] === 'claim').length, 1);
  }
});

// Each worker executes the real create/update actions with mocked DB writes.
// TZ is set before Node starts; no real records or photos are touched.
if (process.env.BLOOMLOG_TIMEZONE_WORKER === '1') {
  test('JST payload worker', async () => {
    const cases = [
      ['00:15', '2026-10-17T15:15:00.000Z'],
      ['09:30', '2026-10-18T00:30:00.000Z'],
      ['18:45', '2026-10-18T09:45:00.000Z'],
      ['23:50', '2026-10-18T14:50:00.000Z'],
      ['', null],
    ];
    const format = value => value === null ? '' : new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(value));
    for (const action of ['submitActivityLogAction', 'updateActivityLogAction']) {
      for (const [input, expected] of cases) {
        const writes = [];
        const run = actions(null, null, [], { onWrite: (table, payload) => {
          if (table === 'activity_logs') writes.push(payload);
        } });
        const f = form(); f.set('occurredAt', input);
        assert.equal((await run[action](f)).status, 'success');
        assert.equal(writes.length, 1);
        assert.equal(writes[0].occurred_at, expected, process.env.TZ + ' ' + action + ' ' + input);
        assert.equal(format(writes[0].occurred_at), input);
        // Reopening the edit form in JST and saving unchanged must preserve the instant.
        f.set('occurredAt', format(writes[0].occurred_at));
        assert.equal((await run.updateActivityLogAction(f)).status, 'success');
        assert.equal(writes[1].occurred_at, expected);
      }
      const writes = [];
      const run = actions(null, null, [], { onWrite: (...args) => writes.push(args) });
      const f = form(); f.set('occurredAt', 'invalid-time');
      const result = await run[action](f);
      assert.equal(result.status, 'error');
      assert.ok(result.fieldErrors.occurredAt);
      assert.equal(writes.length, 0);
    }
  });
} else {
  test('create and update preserve JST input across UTC and Asia/Tokyo server timezones', () => {
    const { spawnSync } = require('node:child_process');
    for (const TZ of ['UTC', 'Asia/Tokyo']) {
      const env = { ...process.env, TZ, BLOOMLOG_TIMEZONE_WORKER: '1' };
      delete env.NODE_TEST_CONTEXT;
      const result = spawnSync(process.execPath, ['--test', '--test-name-pattern=JST payload worker', __filename], {
        env, encoding: 'utf8', timeout: 20000,
      });
      assert.ifError(result.error);
      assert.equal(result.status, 0, TZ + '\n' + result.stdout + result.stderr);
      assert.match(result.stdout, /JST payload worker/);
      assert.match(result.stdout, /tests 1/);
    }
  });
}

test('optional places preserve food names without counting as visits; missing locations fail before write', async () => {
  for (const action of ['submitActivityLogAction', 'updateActivityLogAction']) {
    const writes = []; const run = actions(null, null, [], { onWrite: (table, payload) => { if (table === 'activity_logs') writes.push(payload); } });
    const f = form(); f.set('pavilionId', 'garden'); f.set('title', 'Curry');
    assert.equal((await run[action](f)).status, 'success');
    assert.equal(writes[0].pavilion_id, 'garden'); assert.equal(writes[0].activity_type, 'food'); assert.equal(writes[0].title, 'Curry');
    f.set('pavilionId', ''); assert.equal((await run[action](f)).status, 'success'); assert.equal(writes[1].pavilion_id, null);
    f.set('pavilionId', 'missing'); assert.equal((await run[action](f)).status, 'error'); assert.equal(writes.length, 2);
  }
});
test('pavilion visits can store a photo while still requiring a valid place', async () => {
  const writes = []; const run = actions(null, null, [], { onWrite: (table, payload) => { if (table === 'activity_logs') writes.push(payload); } });
  const f = form(); f.set('activityType', 'pavilion_visit'); f.set('pavilionId', 'garden'); f.set('photo', new File(['photo'], 'visit.jpg', { type: 'image/jpeg' }));
  assert.equal((await run.submitActivityLogAction(f)).status, 'success'); assert.equal(writes[0].title, 'Garden'); assert.ok(writes[0].photo_path);
  f.set('pavilionId', ''); assert.equal((await run.submitActivityLogAction(f)).status, 'error'); assert.equal(writes.length, 1);
});

test('changing a record to pavilion without a new photo retains its existing photo', async () => {
  const writes = [], calls = []; const run = actions(null, null, calls, { onWrite: (table, payload) => { if (table === 'activity_logs') writes.push(payload); } });
  const f = form(); f.set('activityType', 'pavilion_visit'); f.set('pavilionId', 'garden');
  assert.equal((await run.updateActivityLogAction(f)).status, 'success');
  assert.equal(writes[0].photo_path, 'owner/day/old.jpg');
  assert.equal(calls.some(call => Array.isArray(call) && call[0] === 'remove'), false);
});

test('editing a visit day never silently reassigns its event',async()=>{let payload;const f=form();const state=await actions(null,null,[],{onWrite:(table,data)=>{if(table==='visit_sessions')payload=data;}}).updateSessionAction(f);assert.equal(state.status,'success');assert.ok(payload);assert.equal('event_id' in payload,false);});
test('new visit day validates explicit event and refuses same-day cross-event reuse',async()=>{const calls=[];const f=form();f.set('eventId','not-found');assert.equal((await actions(null,null,calls).createSessionAction(f)).status,'error');assert.equal(calls.includes('insert'),false);f.set('eventId','event');const result=await actions(null,null,calls,{existingSession:{id:'old',event_id:'other-event'}}).createSessionAction(f);assert.equal(result.status,'error');assert.match(result.message,/別イベント/);assert.equal(calls.includes('insert'),false);});
test('cross-event new facility is rejected before photo upload while an unchanged historical reference is editable',async()=>{const id='11111111-1111-4111-8111-111111111111';const registry={events:[{id:'other-event',name:'Other',sourceNamespace:'official'}],places:[{eventId:'other-event',sourceId:'plot',pavilionId:id,facilityKey:'facility',identityReviewed:true,identityEvidence:'review'}],anchors:[]};const calls=[];const f=form();f.set('pavilionId',id);f.set('photo',new File(['photo'],'image.jpg',{type:'image/jpeg'}));const rejected=await actions(null,null,calls,{registry}).submitActivityLogAction(f);assert.equal(rejected.status,'error');assert.ok(rejected.fieldErrors.pavilionId);assert.deepEqual(calls,[]);f.delete('photo');assert.equal((await actions(null,null,[],{registry,originalPavilionId:id}).updateActivityLogAction(f)).status,'success');});

test('activating an event registry keeps a legacy facility available for new saves without inventing a source binding',async()=>{const id='11111111-1111-4111-8111-111111111111';const registry={events:[{id:'event',name:'Event',sourceNamespace:'official'}],places:[{eventId:'event',sourceId:'new-plot',pavilionId:id,facilityKey:'new-facility',identityReviewed:true,identityEvidence:'fixture'}],anchors:[]};const writes=[];const f=form();f.set('pavilionId','garden');const result=await actions(null,null,[],{registry,onWrite:(table,payload)=>{if(table==='activity_logs')writes.push(payload);}}).submitActivityLogAction(f);assert.equal(result.status,'success');assert.equal(writes[0].pavilion_id,'garden');assert.equal(registry.places.some(p=>p.pavilionId==='garden'),false);});

test('inactive staging rows are rejected before any record or photo write by both create and edit',async()=>{for(const action of ['submitActivityLogAction','updateActivityLogAction']){const calls=[];const f=form();f.set('pavilionId','garden');f.set('photo',new File(['dummy'],'staging.jpg',{type:'image/jpeg'}));const result=await actions(null,null,calls,{inactivePavilion:true})[action](f);assert.equal(result.status,'error');assert.ok(result.fieldErrors.pavilionId);assert.deepEqual(calls,[]);}});

test('context create, preserved edit and explicit clearing keep source IDs out of title and GPS out of payload',async()=>{
 const id='11111111-1111-4111-8111-111111111111',eventId=sourceCatalog.eventId;const registry={events:[{id:eventId,name:'Expo',sourceNamespace:'source'}],places:[{eventId,sourceId:'organizer-hanameguri',pavilionId:id,facilityKey:'hanameguri',identityReviewed:true,identityEvidence:'mock active parent'}],anchors:[]};const context=contextLogic.makePlaceContext(sourceCatalog,'organizer-hanameguri',null,sourceCatalog.occurrences[0].id);const writes=[];const opts={registry,contextEnabled:true,sessionEventId:eventId,sessionDate:'2027-03-19',onWrite:(t,p)=>{if(t==='activity_logs')writes.push(p);}};
 const f=form();f.set('pavilionId',id);f.set('placeContext',JSON.stringify(context));assert.equal((await actions(null,null,[],opts).submitActivityLogAction(f)).status,'success');assert.deepEqual(writes[0].place_context,context);assert.equal(writes[0].title,'food');assert.equal('latitude' in writes[0],false);assert(contextLogic.describePlaceContext(writes[0].place_context,sourceCatalog).includes(sourceCatalog.occurrences[0].exhibitor_name_raw));
 f.delete('placeContext');assert.equal((await actions(null,null,[],{...opts,originalPavilionId:id,originalContext:writes[0].place_context}).updateActivityLogAction(f)).status,'success');assert.deepEqual(writes[1].place_context,context);
 f.set('placeContext','');assert.equal((await actions(null,null,[],{...opts,originalPavilionId:id,originalContext:context}).updateActivityLogAction(f)).status,'success');assert.equal(writes[2].place_context,null);
});
test('invalid context, wrong date and disabled schema fail before upload/write; old schema omits column',async()=>{
 const id='11111111-1111-4111-8111-111111111111',eventId=sourceCatalog.eventId;const registry={events:[{id:eventId,name:'Expo',sourceNamespace:'source'}],places:[{eventId,sourceId:'organizer-hanameguri',pavilionId:id,facilityKey:'hanameguri',identityReviewed:true,identityEvidence:'fixture'}],anchors:[]};const context=contextLogic.makePlaceContext(sourceCatalog,'organizer-hanameguri',null,sourceCatalog.occurrences[0].id);
 for(const extra of [{contextEnabled:false},{contextEnabled:true,sessionDate:'2026-10-25'},{contextEnabled:true,sessionEventId:'other'}]){const calls=[];const f=form();f.set('pavilionId',id);f.set('placeContext',JSON.stringify(context));f.set('photo',new File(['dummy'],'context.jpg',{type:'image/jpeg'}));const result=await actions(null,null,calls,{registry,sessionEventId:eventId,sessionDate:'2027-03-19',...extra}).submitActivityLogAction(f);assert.equal(result.status,'error');assert.deepEqual(calls,[]);}
 let payload;assert.equal((await actions(null,null,[],{onWrite:(t,p)=>{if(t==='activity_logs')payload=p;}}).submitActivityLogAction(form())).status,'success');assert.equal('place_context' in payload,false);
});


test('response loss after commit is confirmed on retry without second insert or photo upload',async()=>{const id='22222222-2222-4222-8222-222222222222';let saved;const firstCalls=[];const f=form();f.set('pavilionId','garden');f.set('saveAttemptId',id);f.set('saveAttemptChanged','false');f.set('photo',new File(['dummy'],'attempt.jpg',{type:'image/jpeg'}));const first=await actions('activity_logs','insert',firstCalls,{throwDB:true,claim:false,onWrite:(t,p)=>{if(t==='activity_logs')saved=p;}}).submitActivityLogAction(f);assert.equal(first.status,'error');assert.equal(saved.id,id);const retryCalls=[];const retry=await actions(null,null,retryCalls,{submittedLog:saved}).submitActivityLogAction(f);assert.equal(retry.status,'success');assert.deepEqual(retryCalls,[]);f.set('title','Changed after uncertainty');f.set('saveAttemptChanged','true');const conflictCalls=[];const changed=await actions(null,null,conflictCalls,{submittedLog:saved}).submitActivityLogAction(f);assert.equal(changed.status,'error');assert.equal(changed.recoveryHref,`/sessions/day/activity-logs/${id}/edit`);assert.deepEqual(conflictCalls,[]);});
test('simultaneous duplicate attempt uses the existing PK and confirms a matching saved record',async()=>{const id='33333333-3333-4333-8333-333333333333';let saved,reads=0;const f=form();f.set('saveAttemptId',id);f.set('saveAttemptChanged','false');const calls=[];const result=await actions('activity_logs','insert',calls,{errorCode:'23505',submittedLog:()=>++reads===1?null:saved,onWrite:(t,p)=>{if(t==='activity_logs')saved=p;}}).submitActivityLogAction(f);assert.equal(result.status,'success');assert.equal(calls.filter(v=>v==='insert').length,1);assert.equal(saved.id,id);});
