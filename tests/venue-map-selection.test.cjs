/* eslint-disable @typescript-eslint/no-require-imports -- Isolated component rerender tests; no DOM, network, or records. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const symbols={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/memory-map-symbols.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:symbols});
function harness() {
  const slots = [];
  let cursor = 0;
  const state = initial => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  };
  const react = {
    useState: state, useRef: value => state({ current: value })[0],
    useCallback: callback => callback, useEffect() {}, useLayoutEffect() {},
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  const dependencies = {
    '@/lib/memory-map-symbols':symbols,react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': { default: 'Link' },
    './venue-map-config': { VENUE_MAP_ASSET: { width: 1000, height: 1000 } },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/collection-next/venue-map-frame.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  let tree;
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const match = find(child, predicate);
      if (match) return match;
    }
    return null;
  }
  return {
    render(markers, options = {}) { cursor = 0; tree = exports.VenueMapFrame({ markers, children: null, ...options }); },
    viewport(){const n=find(tree,n=>typeof n.props?.onPointerUp==='function');n.props.ref.current={clientWidth:400,clientHeight:500,getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};return n.props;},
    measure(){for(const value of slots){if(value&&typeof value==='object'&&'width' in value&&'height' in value){value.width=400;value.height=500;}}},
    badge(id) { const view = find(tree, node => node.props?.marker?.id === id && typeof node.props?.onSelect === "function"); return view.type(view.props); },
    select(id) {
      const view = find(tree, node => node.props?.marker?.id === id && typeof node.props?.onSelect === 'function');
      assert.ok(view, 'marker selection control exists');
      view.props.onSelect(view.props.marker);
    },
    detail() { return find(tree, node => node.props?.marker && typeof node.props?.onClose === 'function')?.props ?? null; },
  };
}
function marker(id, overrides = {}) {
  return { id, name: 'Dummy', x: 100, y: 100, areaId: 'area', areaName: 'Area', visited: true,
    visitCount: 1, firstVisitedAt: '2026-10-01T00:00:00Z', latestVisitedAt: '2026-10-01T00:00:00Z',
    latestSessionId: 'old-session', bloom: 'small', imageUrl: null, size: 1, rotation: 0, ...overrides };
}

test('selected detail follows the latest marker data across rerenders and ordering changes', () => {
  const h = harness(); const old = marker('a'); const other = marker('b');
  h.render([old, other]); h.select('a'); h.render([old, other]);
  assert.equal(h.detail().marker, old);
  const updated = marker('a', { visitCount: 4, name: 'Updated', latestVisitedAt: '2026-10-24T00:00:00Z', latestSessionId: 'new-session' });
  h.render([other, updated]);
  assert.equal(h.detail().marker, updated);
  assert.equal(h.detail().marker.visitCount, 4);
  assert.equal(h.detail().marker.latestSessionId, 'new-session');
  const unvisited = marker('a', { visited: false, visitCount: 0, latestVisitedAt: null, latestSessionId: null });
  h.render([unvisited]); assert.equal(h.detail().marker, unvisited);
});

test('a removed selected marker hides detail instead of displaying stale data or another marker', () => {
  const h = harness(); const selected = marker('a'); const other = marker('b');
  h.render([selected, other]); h.select('a'); h.render([selected, other]);
  h.render([other]); assert.equal(h.detail(), null);
  h.render([]); assert.equal(h.detail(), null);
  h.render([other]); h.select('b'); h.render([other]); assert.equal(h.detail().marker, other);
});

test('closing selection stays closed when marker data refreshes and allows a new selection', () => {
  const h = harness(); const a = marker('a');
  h.render([a]); assert.equal(h.detail(), null);
  h.select('a'); h.render([a]); h.detail().onClose();
  const updated = marker('a', { visitCount: 2 });
  h.render([updated]); assert.equal(h.detail(), null);
  h.select('a'); h.render([updated]); assert.equal(h.detail().marker, updated);
});

test('illustrated markers receive badge mode and retain unlimited counts without declaring related goods a visit', () => {
 const h=harness();const a=marker('a',{memoryCount:123});const b=marker('b',{visited:false,visitCount:0,memoryCount:9});
 h.render([a,b],{badgeMarkers:true});
 const badge=h.badge('a'); assert.equal(badge.type,'button');
 const count=badge.props.children[1]; assert.equal(count.props.children,'123件');
 const related=h.badge('b'); assert.match(related.props['aria-label'],/未訪問/);
 assert.equal(related.props.children[1].props.children,'9件');
});


test('an active place without records remains selectable at initial zoom with a 44px control',()=>{
 const h=harness();const empty=marker('empty',{visited:false,visitCount:0,memoryCount:0,paperMemory:true});h.render([empty],{badgeMarkers:true});
 const badge=h.badge('empty');assert.equal(badge.type,'button');assert.match(badge.props.className,/h-11 w-11/);assert.match(badge.props['aria-label'],/記録なし/);h.select('empty');h.render([empty],{badgeMarkers:true});assert.equal(h.detail().marker.id,'empty');
});


test('map camera tap converts visible coordinates and ignores drag, pinch, cancellation and marker pointer-up',()=>{
 const h=harness(),calls=[],options={onMapTap:(x,y)=>calls.push([x,y])};h.render([],options);h.measure();h.render([],options);let v=h.viewport();const target={getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};const event=(id,x,y,type='pointerup')=>({pointerId:id,button:0,clientX:x,clientY:y,type,currentTarget:target});
 v.onPointerDown(event(1,140,295));v.onPointerUp(event(1,140,295));assert.deepEqual(calls,[[.35,.59]]);
 v.onPointerDown(event(2,140,295));v.onPointerMove(event(2,180,320));v.onPointerUp(event(2,140,295));assert.equal(calls.length,1);
 v.onPointerDown(event(3,140,295));v.onPointerDown(event(4,150,300));v.onPointerUp(event(4,150,300));v.onPointerUp(event(3,140,295));assert.equal(calls.length,1);
 v.onPointerDown(event(5,140,295));v.onPointerCancel(event(5,140,295,'pointercancel'));v.onPointerUp(event(9,140,295));assert.equal(calls.length,1);
});

test('one actual photo renders one sheet even with four records, and only real additional photos add layers',()=>{const h=harness();function layers(n){if(!n||typeof n!=='object')return 0;return (n.props?.['data-photo-layer']?1:0)+[n.props?.children].flat(Infinity).reduce((sum,c)=>sum+layers(c),0);}for(const count of [1,2,3]){h.render([marker('a',{paperMemory:true,memoryCount:4,previewUrl:'/synthetic.png',photoCount:count})]);assert.equal(layers(h.badge('a')),count);}});
