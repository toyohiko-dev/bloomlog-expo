/* eslint-disable @typescript-eslint/no-require-imports -- Test pure search logic with the existing TypeScript compiler. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { exports, require: (name) => load(path.resolve(path.dirname(file), name + '.ts')) });
  return exports;
}
const { readVisitSessionSearch: read, filterVisitSessions: filter } = load(path.resolve('lib/visit-session-search.ts'));
const sessions = [
  { id: 'oct', visit_date: '2026-10-18', title: '友達と訪問', memo: '雨上がり' },
  { id: 'may', visit_date: '2026-05-08', title: '2回目', memo: '散歩' },
  { id: 'apr', visit_date: '2026-04-05', title: null, memo: null },
];
const logs = [
  { session_id: 'oct', title: 'カレー', memo: '辛かった', activity_type: 'food', pavilion: null },
  { session_id: 'may', title: '旧名', memo: '花いっぱい', activity_type: 'pavilion_visit', pavilion: { name: '庭園パビリオン', official_name: 'Garden Pavilion' } },
  { session_id: 'apr', title: 'ABCピン', memo: null, activity_type: 'pin', pavilion: null },
];
const ids = (params, records = logs) => Array.from(filter(sessions, records, read(params)), (session) => session.id);

test('finds days by their title/memo and by record title/memo/current pavilion name', () => {
  for (const q of ['友達', '雨上がり', 'カレー', '辛かった']) assert.deepEqual(ids({ q }), ['oct']);
  for (const q of ['庭園パビリオン', '花いっぱい', 'Garden', '旧名']) assert.deepEqual(ids({ q }), ['may']);
});
test('normalizes fullwidth characters and English case, supports category and Japanese dates', () => {
  assert.deepEqual(ids({ q: 'ａｂｃ' }), ['apr']);
  assert.deepEqual(ids({ q: 'ピンバッジ' }), ['apr']);
  assert.deepEqual(ids({ q: '2026年5月8日' }), ['may']);
  assert.deepEqual(ids({ q: '2026/05/08' }), ['may']);
});
test('all terms must match the same day, even across title and record fields', () => {
  assert.deepEqual(ids({ q: '友達　カレー 辛かった' }), ['oct']);
  assert.deepEqual(ids({ q: '友達 庭園' }), []);
  assert.deepEqual(ids({ q: '存在しない' }), []);
});
test('date bounds include both endpoints and combine with keyword filtering', () => {
  assert.deepEqual(ids({ from: '2026-05-08', to: '2026-10-18' }), ['oct', 'may']);
  assert.deepEqual(ids({ from: '2026-05-08', to: '2026-05-08' }), ['may']);
  assert.deepEqual(ids({ to: '2026-05-08' }), ['may', 'apr']);
  assert.deepEqual(ids({ from: '2026-05-08', q: 'ピン' }), []);
});
test('rejects reversed or invalid calendar dates without silently broadening results', () => {
  for (const params of [{ from: '2026-02-30' }, { to: 'invalid' }, { from: '2026-10-18', to: '2026-05-08' }, { from: '2026-02-29' }]) {
    assert(read(params).error); assert.deepEqual(ids(params), []);
  }
  assert.equal(read({ from: '2024-02-29' }).error, '');
});
test('empty queries keep order, URL arrays are safe, inputs are not mutated', () => {
  const before = JSON.stringify({ sessions, logs });
  assert.deepEqual(ids({ q: '  ' }), ['oct', 'may', 'apr']);
  assert.deepEqual(ids({ q: ['カレー', '庭園'] }), ['oct']);
  assert.equal(read({ q: 'あ'.repeat(250) }).query.length, 200);
  assert.equal(JSON.stringify({ sessions, logs }), before);
});
