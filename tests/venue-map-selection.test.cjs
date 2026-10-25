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
