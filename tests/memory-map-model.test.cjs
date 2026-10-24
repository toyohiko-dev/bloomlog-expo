/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript logic, no database or geolocation access. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports });
  return exports;
}
const { buildMemoryMap } = load('lib/memory-map.ts');
const { suggestPhotoLocations } = load('lib/photo-location.ts');
const sessions = [{ id: 'first', visit_date: '2027-04-10' }, { id: 'next', visit_date: '2027-05-12' }];
const entry = (id, session_id, activity_type, pavilion_id = null) => ({ id, session_id, activity_type, pavilion_id, title: id, occurred_at: null, created_at: '2027-06-01T00:00:00Z', photo_path: id + '.jpg' });

test('all dates retain unlimited repeated food, visits, pins, photos and unplaced records', () => {
  const entries = [entry('visit-a', 'first', 'pavilion_visit', 'a'), entry('visit-again', 'next', 'pavilion_visit', 'a'),
    ...Array.from({ length: 4 }, (_, i) => entry('food-first-' + i, 'first', 'food')),
    ...Array.from({ length: 2 }, (_, i) => entry('food-next-' + i, 'next', 'food')),
    entry('pin-only', 'next', 'pin', 'b'), entry('unknown-day', 'missing', 'event_participation', 'a')];
  const snapshot = JSON.stringify(entries); const result = buildMemoryMap(entries, sessions);
  assert.equal(result.entries.length, 10); assert.equal(result.unplaced.length, 6);
  assert.equal(result.places.find(place => place.id === 'a').visitCount, 2);
  assert.equal(result.places.find(place => place.id === 'b').visited, false);
  assert.equal(result.places.find(place => place.id === 'b').visitCount, 0);
  assert.equal(result.places.find(place => place.id === 'a').days.find(day => day.date === null).entries.length, 1);
  assert.equal(JSON.stringify(entries), snapshot);
  assert.equal(JSON.stringify(result.dates), JSON.stringify(['2027-05-12', '2027-04-10']));
});

test('daily selection follows visit date, not upload date; switching back loses nothing', () => {
  const entries = [entry('one', 'first', 'pavilion_visit', 'a'), entry('two', 'next', 'pavilion_visit', 'a'), entry('three', 'first', 'food')];
  assert.equal(buildMemoryMap(entries, sessions, '2027-04-10').entries.length, 2);
  assert.equal(buildMemoryMap(entries, sessions, '2027-05-12').places[0].visitCount, 1);
  assert.equal(buildMemoryMap(entries, sessions, '2027-06-01').entries.length, 0);
  assert.equal(buildMemoryMap(entries, sessions).entries.length, 3);
});

test('many places and repeated same-category records are never silently capped', () => {
  const entries = Array.from({ length: 70 }, (_, i) => entry('visit-' + i, 'first', 'pavilion_visit', 'place-' + i));
  for (let i = 0; i < 8; i++) entries.push(entry('repeat-' + i, 'next', 'food', 'place-0'));
  const result = buildMemoryMap(entries, sessions);
  assert.equal(result.places.length, 70);
  assert.equal(result.places.find(place => place.id === 'place-0').entries.length, 9);
  assert.equal(result.places.find(place => place.id === 'place-0').visitCount, 1);
});

const position = { latitude: 35, longitude: 139, accuracy: 10 };
const places = [{ id: 'a', latitude: 35, longitude: 139, verified: true }, { id: 'b', latitude: 35.0001, longitude: 139, verified: true }];
test('GPS never invents candidates or promotes previous place when coordinates/permission are missing', () => {
  for (const permission of ['unknown', 'denied', 'granted']) {
    const result = suggestPhotoLocations({ permission, position: null, places, previousPlaceId: 'previous' });
    assert.equal(result.status, permission === 'denied' ? 'denied' : 'unavailable');
    assert.equal(result.candidates.length, 0); assert.equal(result.previousPlaceId, 'previous');
  }
  assert.equal(suggestPhotoLocations({ permission: 'granted', position, places: places.map(place => ({ ...place, verified: false })) }).status, 'unavailable');
  assert.equal(suggestPhotoLocations({ permission: 'granted', position: { ...position, latitude: NaN }, places }).status, 'unavailable');
});

test('ambiguous and coarse positions stay suggestions; verified isolated place can be proposed', () => {
  const ambiguous = suggestPhotoLocations({ permission: 'granted', position, places });
  assert.equal(ambiguous.status, 'ambiguous'); assert.equal(ambiguous.candidates.length, 2);
  const isolated = suggestPhotoLocations({ permission: 'granted', position, places: [places[0]] });
  assert.equal(isolated.status, 'suggestion'); assert.equal(isolated.candidates[0], 'a');
  assert.equal(suggestPhotoLocations({ permission: 'granted', position: { ...position, accuracy: 400 }, places }).status, 'ambiguous');
  const far = suggestPhotoLocations({ permission: 'granted', position, places: [{ ...places[0], latitude: 36 }] });
  assert.equal(far.candidates.length, 0);
  const crowded = suggestPhotoLocations({ permission: 'granted', position, places: Array.from({ length: 12 }, (_, i) => ({ ...places[0], id: String(i) })) });
  assert.equal(crowded.candidates.length, 3);
});

test('related place never overwrites food or pin names in shared display formatting', () => {
  const { getActivityLogTitle } = load('lib/session-shared.ts');
  const pavilion = { name: 'Garden' };
  assert.equal(getActivityLogTitle({ activity_type: 'food', title: 'Curry', pavilion }), 'Curry');
  assert.equal(getActivityLogTitle({ activity_type: 'pin', title: 'Badge', pavilion }), 'Badge');
  assert.equal(getActivityLogTitle({ activity_type: 'pavilion_visit', title: 'Old name', pavilion }), 'Garden');
});
