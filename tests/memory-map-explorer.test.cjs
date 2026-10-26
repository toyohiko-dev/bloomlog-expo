/* eslint-disable @typescript-eslint/no-require-imports -- Client rerender tests with dummy records and no network. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, URLSearchParams, require: name => {
    if (!(name in dependencies)) throw Error(name); return dependencies[name];
  } }); return exports;
}
const model = load('lib/memory-map.ts');
const navigation=load('lib/memory-map-navigation.ts');
const { createMemoryMapDemo } = load('lib/memory-map-demo.ts');
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const found = find(child, predicate); if (found) return found; }
  return null;
}
function text(node) { if (typeof node === 'string' || typeof node === 'number') return String(node); if (!node || typeof node !== 'object') return ''; return [node.props?.children].flat(Infinity).map(text).join(' '); }
function harness(hydrated=true) {
  const slots=[];let cursor=0;
  const jsx = (type, props) => ({ type, props });
  const dependencies = { react: { useSyncExternalStore:(_subscribe,getSnapshot,getServerSnapshot)=>hydrated?getSnapshot():getServerSnapshot(),useState: initial => {const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>slots[i]=v];} },
    'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': 'Link', 'next/image': 'Image',
    '@/lib/memory-map-navigation':navigation,'@/lib/green-expo-map':{greenExpoMapAnchors:[]},'@/lib/memory-map': model, './illustrated-memory-map': { IllustratedMemoryMap: 'Map' } };
  const { MemoryMapExplorer } = load('app/collection-next/memory-map-explorer.tsx', dependencies);
  const pavilions = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
  const data = createMemoryMapDemo(pavilions);
  const props = { ...data, logs: data.logs.map(log => ({ ...log, photoUrl: '/dummy/' + log.id + '.jpg' })), areas: [], pavilions, demo: true };
  return { props, render: () => {cursor=0;return MemoryMapExplorer(props);}, selectDate(tree, value) { find(tree, node => node.props?.['aria-label'] === '地図に表示する来場日').props.onChange({ target: { value } }); } };
}

test('explorer wires cumulative/day selection and place detail with all dates and all records', () => {
  const h = harness(); let tree = h.render();
  let map = find(tree, node => node.type === 'Map');
  assert.equal(map.props.places.filter(place => place.visited).length, 1); assert.equal(map.props.places.find(place => place.id === 'a').visitCount, 2);
  let closed = false; let detail = map.props.renderPlaceDetail('a', () => { closed = true; });
  assert.match(text(detail), /2027-04-10/); assert.match(text(detail), /2027-05-12/);
  for (const entry of h.props.logs.filter(entry => entry.pavilion_id === 'a')) assert.ok(text(detail).includes(entry.title));
  assert.equal(text(detail).includes('記録を見る'), false, 'demo cannot navigate into fake records');
  find(detail, node => node.props?.['aria-label'] === '場所の思い出を閉じる').props.onClick(); assert.equal(closed, true);
  h.selectDate(tree, '2027-04-10'); tree = h.render(); map = find(tree, node => node.type === 'Map');
  assert.equal(map.props.places.find(place => place.id === 'a').visitCount, 1); detail = map.props.renderPlaceDetail('a', () => {});
  assert.match(text(detail), /フードの思い出 4/); assert.doesNotMatch(text(detail), /翌月のフード/);
  h.selectDate(tree, '2027-05-12'); tree = h.render(); detail = find(tree, node => node.type === 'Map').props.renderPlaceDetail('b', () => {});
  assert.match(text(detail), /訪問の記録なし/); assert.match(text(detail), /関連グッズだけの記録/);
  assert.match(text(tree), /場所は後で決める思い出/);
  h.selectDate(tree, ''); tree = h.render(); assert.equal(find(tree, node => node.type === 'Map').props.places.find(place => place.id === 'a').visitCount, 2);
});

test('day changes and repeated clicks never mutate demo records or lose unplaced entries', () => {
  const h = harness(); const before = JSON.stringify(h.props.logs);
  for (const date of ['2027-05-12', '2027-04-10', '', '2027-05-12', '']) { const tree = h.render(); h.selectDate(tree, date); }
  const tree = h.render(); assert.match(text(tree), /場所は後で決める思い出/);
  assert.equal(JSON.stringify(h.props.logs), before);
});

test('records attached to a removed or unavailable pavilion remain visible off the map', () => {
  const h = harness(); h.props.logs.push({ ...h.props.logs[0], id: 'orphan', pavilion_id: 'unavailable', title: 'Old place memory', photoUrl: null });
  const tree = h.render();
  assert.match(text(tree), /Old place memory/);
  assert.equal(find(tree, node => node.type === 'Map').props.pavilions.some(item => item.id === 'unavailable'), false);
});

test('registered event without reviewed illustration anchors keeps all records visible as unmapped',()=>{const h=harness();h.props.explicitAnchors=[];const tree=h.render();assert.match(text(tree),/地図位置未対応/);for(const log of h.props.logs)assert.ok(text(tree).includes(log.title));assert.match(text(tree),/1 か所訪問|1.*か所訪問/);});


test('return focus opens the same dated unmapped place without inventing coordinates or losing entries',()=>{const h=harness();h.props.explicitAnchors=[];h.props.initialPlaceId='a';h.props.initialDate='2027-04-10';const tree=h.render();const panel=find(tree,n=>n.props?.['aria-label']==='位置未対応の場所の思い出');assert(panel);assert.match(text(panel),/フードの思い出 4/);assert.doesNotMatch(text(panel),/翌月のフード/);const map=find(tree,n=>n.type==='Map');assert.equal(map.props.focusPlaceId,'a');assert.equal(map.props.explicitAnchors.length,0);});


test('server-rendered date controls wait for hydration instead of losing the first click',()=>{const pending=harness(false);const tree=pending.render();assert.equal(find(tree,n=>n.props?.['aria-label']==='2027-04-10の記録を見る').props.disabled,true);const ready=harness(true);assert.equal(find(ready.render(),n=>n.props?.['aria-label']==='2027-04-10の記録を見る').props.disabled,false);});


test('real-mode links follow the selected day and expose a non-writing location assignment route',()=>{
 const h=harness();h.props.demo=false;h.props.eventId='expo';let tree=h.render();h.selectDate(tree,'2027-04-10');tree=h.render();
 const day=h.props.sessions.find(day=>day.visit_date==='2027-04-10');
 const photo=find(tree,n=>n.props?.href?.includes('/activities/new?return=map#photo'));assert(photo);assert(photo.props.href.includes(day.id));
 h.selectDate(tree,'2027-05-12');tree=h.render();const later=h.props.sessions.find(day=>day.visit_date==='2027-05-12');assert(find(tree,n=>n.props?.href?.includes(`/sessions/${later.id}/activities/new?return=map#photo`)));
 const assignment=find(tree,n=>n.props?.href?.includes('/edit?return=map#related-place'));assert(assignment);assert.match(text(assignment),/場所を指定する/);

});
