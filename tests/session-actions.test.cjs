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
      insert() { operation = 'insert'; calls.push('insert'); return this; }, update() { operation = 'update'; calls.push('update'); return this; }, delete() { operation = 'delete'; calls.push('delete'); return this; },
      select() { return this; }, eq() { return this; }, is() { return this; }, or() { return this; },
      single() { return this; }, maybeSingle() { return this; },
      then(resolve, reject) {
        if (options.throwDB && operation === errorOperation) return reject(Error('offline'));
        resolve({ data: operation === 'delete' ? [{ photo_path: 'owner/day/deleted.jpg' }] : options.stale && operation === 'update' ? null : { id: 'event' }, error: table === errorTable && operation === errorOperation ? { message: 'private database detail' } : null });
      },
    }; return q;
  };
  return load('app/sessions/actions.ts', {
    'next/cache': { revalidatePath() {} }, 'next/navigation': { redirect() { throw Error('redirect'); } },
    '@/lib/auth': { requireUser: async () => ({ id: 'owner' }) },
    '@/lib/activity-photo-cleanup': { cleanupUncommittedActivityPhoto: cleanup },
    '@/lib/activity-types': { normalizeAcquisitionMethod: () => null },
    '@/lib/supabase/server': { createServerSupabaseClient: async () => ({ from: query,
      rpc: async (_name, args) => { calls.push(['claim', args.p_path]); return { data: options.claim !== false, error: options.rpcError ? Error('RPC missing') : null }; },
      storage: { from: () => ({ upload: async () => { calls.push('upload'); return { error: null }; }, remove: async paths => { calls.push(['remove', ...paths]); if (options.throwRemove) throw Error('offline'); return { error: options.removeError ? Error('denied') : null }; } }) } }) },
    '@/lib/supabase/shared': { createPublicSupabaseClient: () => ({ from: query }) },
    '@/lib/sessions': { getSessionByVisitDate: async () => null, getDefaultEventId: async () => 'event',
      getSession: async () => ({ visit_date: '2026-10-18', event_id: 'event' }),
      getActivityLog: async () => ({ session_id: 'day', photo_path: 'owner/day/old.jpg' }) },
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
