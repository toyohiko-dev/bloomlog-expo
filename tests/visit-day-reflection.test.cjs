/* eslint-disable @typescript-eslint/no-require-imports -- Node tests transpile the existing TypeScript without extra packages. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => load(path.resolve(path.dirname(file), name + '.ts')) });
  return exports;
}
const { buildVisitDayReflection: reflect, buildVisitDayReflections: group } = load(path.resolve('lib/visit-day-reflection.ts'));
function log(id, type, title, extra = {}) {
  return { id, session_id: 'day-a', activity_type: type, title, pavilion: null, occurred_at: null, created_at: '2026-10-18T03:00:00Z', ...extra };
}

test('empty days explain the absence of saved memories', () => {
  const result = reflect([]);
  assert.equal(result.count, 0); assert.match(result.description, /まだ思い出はありません/);
});

test('a single food record produces a factual title and category summary', () => {
  const result = reflect([log('a', 'food', 'カレー')]);
  assert.equal(result.title, 'カレーの思い出');
  assert.equal(result.description, 'フード：カレー（1件）。');
  assert.doesNotMatch(result.description, /楽しい|美味しい|最高/);
});

test('pavilion display names override old titles, repeated visits count without duplicate names', () => {
  const logs = [log('a', 'pavilion_visit', '旧館名', { pavilion: { name: '庭園パビリオン' } }), log('b', 'pavilion_visit', '庭園パビリオン'), log('c', 'food', 'カレー')];
  const result = reflect(logs);
  assert.equal(result.title, 'パビリオンとフードを記録した日');
  assert.equal(result.count, 3);
  assert.equal(result.description, 'パビリオン：庭園パビリオン（2件）。フード：カレー（1件）。');
  assert.doesNotMatch(result.description, /旧館名/);
});

test('summary stays stable across query order, missing time and invalid dates without mutating records', () => {
  const logs = [log('late', 'food', '夕食', { occurred_at: '2026-10-18T10:00:00Z' }), log('early', 'food', '昼食', { occurred_at: '2026-10-18T03:00:00Z' }), log('unknown', 'food', '時刻なし', { created_at: 'invalid' })];
  const before = JSON.stringify(logs);
  const result = reflect(logs);
  assert.equal(result.description, reflect([...logs].reverse()).description);
  assert.match(result.description, /昼食、夕食など（3件）/);
  assert.equal(JSON.stringify(logs), before);
});

test('all four categories, unnamed records and unknown types do not invent content', () => {
  const result = reflect([log('a', 'pavilion_visit', null), log('b', 'food', ' '), log('c', 'pin', 'ピン'), log('d', 'event_participation', '催事')]);
  assert.equal(result.title, '4種類の思い出を記録した日');
  assert.match(result.description, /パビリオン：1件（名称未設定）/);
  assert.match(result.description, /ピンバッジ：ピン/);
  assert.match(result.description, /イベント：催事/);
  assert.equal(reflect([log('e', 'legacy', 'internal')]).description, 'その他の記録：1件。');
});

test('long and multiline names are bounded and days remain isolated', () => {
  const summaries = group([log('a', 'food', 'カレー\n  大盛り'), log('b', 'food', 'あ'.repeat(200), { session_id: 'day-b' })]);
  assert.equal(summaries.get('day-a').title, 'カレー 大盛りの思い出');
  assert(!summaries.get('day-a').description.includes('あ'));
  assert(summaries.get('day-b').description.length < 60);
});
