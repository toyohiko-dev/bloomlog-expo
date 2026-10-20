/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness loads CommonJS and transpiles TSX without additional dependencies. */
// Run with node --test tests/activity-log-form.test.cjs. Server actions and browser
// objects are mocked: these tests never connect to Supabase or write records.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function harness(props = {}, storage = memoryStorage()) {
  const slots = [];
  let cursor = 0;
  let tree;
  let task;
  let effects = [];
  let action = async () => ({ status: 'success', message: 'saved', fieldErrors: {} });
  const calls = [];
  const navigation = [];
  const fileInput = { value: '', files: [] };
  const hook = (initial) => {
    const i = cursor++;
    if (!(i in slots)) slots[i] = initial;
    return [slots[i], (value) => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
  };
  const react = {
    useState: hook,
    useRef(initial) { return hook({ current: initial })[0]; },
    useDeferredValue(value) { return value; },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((value, index) => value !== slots[i][index])) {
        slots[i] = deps;
        effects.push(effect);
      }
    },
    useTransition() {
      const [pending, setPending] = hook(false);
      return [pending, (fn) => {
        setPending(true);
        task = fn().finally(() => setPending(false));
      }];
    },
  };
  const jsx = (type, props) => ({ type, props: props || {} });
  const modules = {};
  function load(file) {
    if (modules[file]) return modules[file].exports;
    const compiledModule = { exports: {} };
    modules[file] = compiledModule;
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(code, {
      module: compiledModule, exports: compiledModule.exports, Intl, Date,
      window: { localStorage: storage },
      FormData: class extends FormData {
        constructor() {
          super();
          for (const node of nodes(tree)) {
            const p = node.props;
            if (!p.name || (p.type === 'radio' && !p.checked)) continue;
            if (p.type === 'file') {
              if (fileInput.files[0]) this.set(p.name, fileInput.files[0]);
            } else this.set(p.name, p.value ?? '');
          }
        }
      },
      DataTransfer: class {
        files = [];
        items = { add: (file) => this.files.push(file) };
      },
      require(id) {
        if (id === 'react') return react;
        if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (id === 'next/link') return { default: 'a' };
        if (id === 'next/navigation') return { useRouter: () => ({ push: (p) => navigation.push(p), refresh() {} }) };
        if (id === '@/app/sessions/actions') {
          const submit = (data) => { calls.push(data); return action(data); };
          return { submitActivityLogAction: submit, updateActivityLogAction: submit };
        }
        if (id === '@/lib/session-shared') return { searchPavilions: (all) => all };
        if (id.startsWith('@/lib/')) return load(path.resolve(id.slice(2) + '.ts'));
        if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id + '.ts'));
        throw new Error(`Unexpected import ${id}`);
      },
    }, { filename: file });
    return compiledModule.exports;
  }
  const { ActivityLogForm } = load(path.resolve('app/sessions/[id]/activity-log-form.tsx'));
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap((item) => nodes(item));
    return [node, ...nodes(node.props?.children)];
  }
  function render() {
    cursor = 0;
    tree = ActivityLogForm({ sessionId: 'test-session', pavilions: [{ id: 'garden', name: '庭園', aliases: [] }], ...props });
    const input = nodes(tree).find((node) => node.props.id === 'photo');
    if (input?.props.ref) {
      if (typeof input.props.ref === 'function') input.props.ref(fileInput);
      else input.props.ref.current = fileInput;
    }
    if (effects.length) {
      const scheduled = effects; effects = [];
      scheduled.forEach((effect) => effect());
      render();
    }
  }
  function field(id) { return nodes(tree).find((node) => node.props.id === id); }
  render();
  return {
    calls, navigation, fileInput, render, storage,
    setAction(fn) { action = fn; },
    value(id) { return field(id)?.props.value; },
    change(id, value) { field(id).props.onChange({ target: { value } }); render(); },
    type(value) { nodes(tree).find((n) => n.props.name === 'activityType' && n.props.value === value).props.onChange(); render(); },
    photo(file) { fileInput.files = file ? [file] : []; field('photo').props.onChange({ target: fileInput }); render(); },
    selectPavilion() { nodes(tree).find((n) => n.type === 'button' && n.props.type === 'button').props.onClick(); render(); },
    submit() { tree.props.onSubmit({ preventDefault() {}, currentTarget: {} }); render(); },
    async settle() { await task; render(); },
    message() { return nodes(tree).find((n) => n.type === 'div' && n.props.children === 'saved')?.props.children; },
    text() { return nodes(tree).flatMap((n) => typeof n.props.children === 'string' ? [n.props.children] : []).join(' '); },
  };
}

function memoryStorage() {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}

test('new entries restore independent text, time, price, selection and File drafts', async () => {
  const h = harness();
  h.type('food');
  h.change('title', 'カレー'); h.change('price', '1200');
  h.change('memo', '辛い'); h.change('occurredAt', '12:30');
  const curry = new File(['curry'], 'curry.png', { type: 'image/png' });
  h.photo(curry);
  h.type('pin');
  assert.equal(h.value('title'), ''); assert.equal(h.value('memo'), '');
  assert.equal(h.value('occurredAt'), ''); assert.equal(h.fileInput.files.length, 0);
  h.change('title', 'ピン'); h.change('price', '500');
  const pin = new File(['pin'], 'pin.png', { type: 'image/png' });
  h.photo(pin);
  h.type('pavilion_visit'); h.change('pavilion-search', '庭園'); h.selectPavilion();
  h.change('memo', '花'); h.change('occurredAt', '14:00');
  h.type('event_participation'); h.change('title', '催事');
  h.type('food');
  assert.equal(h.value('title'), 'カレー'); assert.equal(h.value('price'), '1200');
  assert.equal(h.value('memo'), '辛い'); assert.equal(h.value('occurredAt'), '12:30');
  assert.equal(h.fileInput.files[0], curry);
  h.submit(); await h.settle();
  assert.equal(h.calls[0].get('photo').name, 'curry.png');
  assert.equal(await h.calls[0].get('photo').text(), 'curry');
  assert.equal(h.value('title'), ''); assert.equal(h.fileInput.files.length, 0);
  assert.equal(h.message(), 'saved');
  h.type('pin'); assert.equal(h.value('title'), 'ピン'); assert.equal(h.fileInput.files[0], pin);
  h.type('pavilion_visit'); assert.equal(h.value('pavilion-search'), '庭園');
  assert.equal(h.value('memo'), '花'); assert.equal(h.value('occurredAt'), '14:00');
  h.submit(); await h.settle();
  assert.equal(h.calls[1].get('pavilionId'), 'garden');
  assert.equal(h.calls[1].get('photo'), null);
  h.type('event_participation'); assert.equal(h.value('title'), '催事');
});

test('failed result and thrown error preserve inputs and selected photo for retry', async () => {
  const h = harness(); h.type('food'); h.change('title', 'カレー');
  h.change('memo', 'メモ'); h.change('occurredAt', '12:00');
  const photo = new File(['image'], 'food.png'); h.photo(photo);
  for (const response of [async () => ({ status: 'error', message: 'failed', fieldErrors: {} }), async () => { throw new Error('offline'); }]) {
    h.setAction(response); h.submit(); await h.settle();
    assert.equal(h.value('title'), 'カレー'); assert.equal(h.value('memo'), 'メモ');
    assert.equal(h.value('occurredAt'), '12:00'); assert.equal(h.fileInput.files[0], photo);
  }
  h.photo(null); h.submit(); await h.settle(); assert.equal(h.calls[2].get('photo'), null);
});

test('pending submission rejects duplicate submits and type changes until completion', async () => {
  const h = harness(); h.type('food'); h.change('title', 'カレー');
  let resolve; h.setAction(() => new Promise((done) => { resolve = done; }));
  h.submit(); h.submit(); h.type('pin');
  assert.equal(h.calls.length, 1); assert.equal(h.value('title'), 'カレー');
  resolve({ status: 'success', message: 'saved', fieldErrors: {} }); await h.settle();
  h.type('pin'); h.change('title', 'ピン'); h.type('food'); assert.equal(h.value('title'), '');
});

test('edit keeps shared memo/time and existing type-specific drafts, then returns to session', async () => {
  const h = harness({ mode: 'edit', logId: 'log', initialActivityType: 'food', initialTitle: 'カレー', initialMemo: '元のメモ', initialOccurredAt: '2027-03-20T03:30:00Z', initialPrice: 1000 });
  h.type('pin'); assert.equal(h.value('title'), '');
  assert.equal(h.value('memo'), '元のメモ'); assert.equal(h.value('occurredAt'), '12:30');
  h.change('title', 'ピン'); h.type('food');
  assert.equal(h.value('title'), 'カレー'); assert.equal(h.value('price'), '1000');
  h.submit(); await h.settle();
  assert.equal(h.value('title'), 'カレー'); assert.equal(h.calls[0].get('logId'), 'log');
  assert.deepEqual(h.navigation, ['/sessions/test-session']);
});

test('persistent drafts survive remount, retain other types on success, and mark missing photo', async () => {
  const storage = memoryStorage();
  const props = { draftOwnerId: 'user-a' };
  let h = harness(props, storage);
  h.type('food'); h.change('title', 'カレー'); h.change('memo', '辛い'); h.change('occurredAt', '12:30'); h.change('price', '1200');
  h.photo(new File(['photo'], 'curry.png'));
  h.type('pavilion_visit'); h.change('pavilion-search', '庭園'); h.selectPavilion();
  h.type('food');
  h = harness(props, storage);
  assert.equal(h.value('title'), 'カレー'); assert.equal(h.value('memo'), '辛い');
  assert.equal(h.value('occurredAt'), '12:30'); assert.equal(h.value('price'), '1200');
  assert.equal(h.fileInput.files.length, 0);
  assert.match(h.text(), /写真はもう一度選択/);
  h.setAction(async () => { throw new Error('offline'); }); h.submit(); await h.settle();
  h = harness(props, storage); assert.equal(h.value('title'), 'カレー');
  h.submit(); await h.settle();
  h = harness(props, storage); assert.equal(h.value('title'), '');
  h.type('pavilion_visit'); assert.equal(h.value('pavilion-search'), '庭園');
  h.submit(); await h.settle(); assert.equal(h.calls[0].get('pavilionId'), 'garden');
});

test('persistent scope separates users and sessions, handles corrupt data and storage denial', () => {
  const storage = memoryStorage();
  const a = harness({ draftOwnerId: 'a' }, storage); a.type('food'); a.change('title', '秘密のカレー');
  const b = harness({ draftOwnerId: 'b' }, storage); b.type('food'); assert.equal(b.value('title'), '');
  const other = harness({ draftOwnerId: 'a', sessionId: 'other-day' }, storage); other.type('food'); assert.equal(other.value('title'), '');
  const key = [...storage.data.keys()].find((key) => key.endsWith(':food') && key.includes(':a:'));
  for (const raw of ['{broken', 'null', JSON.stringify({ version: 1, activityType: 'food', title: { nested: true } }), 'x'.repeat(17000)]) {
    storage.data.set(key, raw);
    const safe = harness({ draftOwnerId: 'a' }, storage); safe.type('food'); assert.equal(safe.value('title'), '');
  }
  const unavailable = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('denied'); } };
  const h = harness({ draftOwnerId: 'a' }, unavailable); h.type('food'); h.change('title', 'カレー');
  assert.equal(h.value('title'), 'カレー'); assert.match(h.text(), /下書きを保存できません/);
  const edit = harness({ draftOwnerId: 'a', mode: 'edit', initialActivityType: 'food', initialTitle: '保存済み' }, storage);
  assert.equal(edit.value('title'), '保存済み');
});
