/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness loads CommonJS and transpiles TSX without additional dependencies. */
// Run with node --test tests/activity-log-form.test.cjs. Server actions and browser
// objects are mocked: these tests never connect to Supabase or write records.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function harness(props = {}, storage = memoryStorage(), prepare = async file => file) {
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
      module: compiledModule, exports: compiledModule.exports, Intl, Date, URLSearchParams, crypto:require('node:crypto').webcrypto,
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
        if (id === '@/lib/prepare-activity-photo') return {prepareActivityPhoto:prepare,PhotoPreparationError:class extends Error {constructor(){super('Photo preparation failed');}}};
        if (id === '@/lib/place-coordinate-catalog') return {placeRegistry:{events:[],places:[],anchors:[]}};
        if (id === './map-point-picker') return {MapPointPicker:'PointPicker'};
        if (id === './photo-location-suggestions') return {PhotoLocationSuggestions:'LocationSuggestions',SelectedPhotoPreview:'PhotoPreview',PlaceContextSummary:'ContextSummary'};
        if (id === 'react') return react;
        if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (id === 'next/link') return { default: 'a' };
        if (id === 'next/navigation') return { useRouter: () => ({ push: (p) => navigation.push(p), refresh() {} }) };
        if (id === '@/app/sessions/actions') {
          const submit = (data) => { calls.push(data); return action(data); };
          return { submitActivityLogAction: submit, updateActivityLogAction: submit };
        }
        if (id === '@/lib/session-shared') return { searchPavilions: (all,query) => query.trim() ? all : [] };
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
    openPoint(){nodes(tree).find(n=>n.type==='button'&&['地図で場所を選ぶ','場所を選び直す'].includes(n.props.children)).props.onClick();render();},
    confirmPoint(point){nodes(tree).find(n=>n.type==='PointPicker').props.onConfirm(point);render();},
    cancelPoint(){nodes(tree).find(n=>n.type==='PointPicker').props.onCancel();render();},
    deferPoint(){nodes(tree).find(n=>n.type==='button'&&n.props.children==='場所を決めずに保存').props.onClick();render();},
    placeOptions(){return nodes(field("related-place")).filter(n=>n.type==="option").map(n=>n.props.value);},
    setAction(fn) { action = fn; },
    value(id) { return field(id)?.props.value; },
    change(id, value) { field(id).props.onChange({ target: { value } }); render(); },
    type(value) { nodes(tree).find((n) => n.props.name === 'activityType' && n.props.value === value).props.onChange(); render(); },
    context(id,context) { nodes(tree).find(n=>n.type==='LocationSuggestions').props.onContextSelect(id,context);render(); },
    location(id) { nodes(tree).find(n=>n.type==='LocationSuggestions').props.onSelect(id);render(); },
    camera(file) { const input=nodes(tree).find(n=>n.props['aria-label']==='カメラで撮影');input.props.onChange({target:{files:[file],value:'camera'}});render(); },
    removePhoto() { nodes(tree).find(n=>n.type==='button'&&n.props.children==='選択した写真を取り消す').props.onClick();render(); },
    photo(file) { fileInput.files = file ? [file] : []; field('photo').props.onChange({ target: fileInput }); render(); },
    selectPavilion() { field('related-place').props.onChange({target:{value:'garden'}}); render(); },
    submit() { tree.props.onSubmit({ preventDefault() {}, currentTarget: {} }); render(); },
    async settle() { await task; render(); },
    message() { return nodes(tree).some(n=>n.type==='div'&&[n.props.children].flat().includes('saved'))?'saved':undefined; },
    disclosures() {return nodes(tree).filter(n=>n.type==='details').map(n=>({open:n.props.open,summary:nodes(n).find(x=>x.type==='summary')?.props.children}));},
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
  assert.equal(h.value('occurredAt'), ''); assert.equal(h.fileInput.files[0], curry);
  h.change('title', 'ピン'); h.change('price', '500');
  const pin = new File(['pin'], 'pin.png', { type: 'image/png' });
  h.photo(pin);
  h.type('pavilion_visit'); h.change('pavilion-search', '庭園'); h.selectPavilion();
  h.change('memo', '花'); h.change('occurredAt', '14:00');
  h.type('event_participation'); h.change('title', '催事');
  h.type('food');
  assert.equal(h.value('title'), 'カレー'); assert.equal(h.value('price'), '1200');
  assert.equal(h.value('memo'), '辛い'); assert.equal(h.value('occurredAt'), '12:30');
  assert.equal(h.fileInput.files[0], pin);
  h.photo(curry); h.submit(); await h.settle();
  assert.equal(h.calls[0].get('photo').name, 'curry.png');
  assert.equal(await h.calls[0].get('photo').text(), 'curry');
  assert.equal(h.value('title'), ''); assert.equal(h.fileInput.files.length, 0);
  assert.equal(h.message(), 'saved');
  h.type('pin'); assert.equal(h.value('title'), 'ピン'); assert.equal(h.fileInput.files.length, 0);
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
  h.photo(null); h.submit(); await h.settle(); assert.equal(h.calls[2].get('photo').name, 'food.png');
  h.removePhoto(); h.submit(); await h.settle(); assert.equal(h.calls[3].get('photo'), null);
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
  h.removePhoto();h.submit(); await h.settle();
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

test('photo-first food input keeps optional place on failure and after successful save, and can defer it', async () => {
  const h = harness(); h.type('food'); h.change('related-place', 'garden'); h.change('title', 'Curry');
  h.photo(new File(['photo'], 'food.jpg', { type: 'image/jpeg' }));
  h.setAction(async () => ({ status: 'error', message: 'failed', fieldErrors: {} })); h.submit(); await h.settle();
  assert.equal(h.value('related-place'), 'garden'); assert.equal(h.fileInput.files.length, 1);
  h.setAction(async () => ({ status: 'success', message: 'saved', fieldErrors: {} })); h.submit(); await h.settle();
  assert.equal(h.value('related-place'), 'garden'); assert.equal(h.value('title'), '');
  h.change('related-place', ''); assert.equal(h.value('related-place'), '');
});

test('photo-first category changes and cancelled chooser retain one selected file until explicit removal',()=>{const h=harness();const photo=new File(['jpeg'],'camera.jpg');h.photo(photo);for(const type of ['food','pin','pavilion_visit','event_participation']){h.type(type);assert.equal(h.fileInput.files[0],photo);}h.photo(null);assert.equal(h.fileInput.files[0],photo);h.removePhoto();assert.equal(h.fileInput.files.length,0);});
test('changing the existing visit day keeps fields and photo and submits to the selected session',async()=>{const h=harness({visitSessions:[{id:'test-session',visit_date:'2027-04-10'},{id:'next-day',visit_date:'2027-05-12'}],successRedirectPath:'/sessions/test-session'});h.type('food');h.change('title','Meal');const photo=new File(['image'],'meal.jpg');h.photo(photo);h.change('recording-session','next-day');assert.equal(h.value('title'),'Meal');assert.equal(h.fileInput.files[0],photo);h.submit();await h.settle();assert.equal(h.calls[0].get('sessionId'),'next-day');assert.equal(h.calls[0].get('photo').name,'meal.jpg');assert.equal(h.navigation[0],'/sessions/next-day');});

test('camera selection and suggested-place correction preserve meal title and retry payload',async()=>{const h=harness();h.type('food');h.change('title','Meal');const photo=new File(['camera'],'camera.jpg');h.camera(photo);h.location('garden');assert.equal(h.value('related-place'),'garden');assert.equal(h.value('title'),'Meal');h.setAction(async()=>({status:'error',message:'offline',fieldErrors:{}}));h.submit();await h.settle();assert.equal(h.calls[0].get('photo').name,'camera.jpg');assert.equal(h.value('title'),'Meal');h.change('related-place','');assert.equal(h.value('title'),'Meal');assert.equal(h.fileInput.files[0],photo);});
test('editing draft survives remount separately from new-entry and other-record drafts',()=>{const storage=memoryStorage();const props={mode:'edit',logId:'a',draftOwnerId:'owner',initialActivityType:'food',initialTitle:'Original'};const h=harness(props,storage);h.change('title','Unsaved edit');h.photo(new File(['image'],'edit.jpg'));const restored=harness(props,storage);assert.equal(restored.value('title'),'Unsaved edit');assert.match(restored.text(),/写真はもう一度/);assert.equal(harness({...props,logId:'b'},storage).value('title'),'Original');const fresh=harness({draftOwnerId:'owner'},storage);fresh.type('food');assert.equal(fresh.value('title'),'');});

test('empty place search lists facilities and returns to the full list after clearing',()=>{const h=harness();assert(h.placeOptions().includes('garden'));h.change('pavilion-search','Garden');h.change('pavilion-search','');assert(h.placeOptions().includes('garden'));});


test('place context survives failed save, category return and draft remount, and clears on explicit place change',async()=>{
 const context={version:1,event_id:'e60f2360-8147-4112-969a-00954596ceb6',source_catalog_version:'a'.repeat(64),source_place_id:'organizer-hanameguri',subplace_source_id:null,indoor_occurrence_id:'indoor-20261009-all-01'};
 const storage=memoryStorage();let h=harness({draftOwnerId:'synthetic-owner',sessionId:'context-day'},storage);h.type('food');h.change('title','Synthetic food');h.context('garden',context);h.setAction(async()=>({status:'error',message:'retry',fieldErrors:{}}));h.submit();await h.settle();assert.deepEqual(JSON.parse(h.calls[0].get('placeContext')),context);
 h.type('pin');h.type('food');h.submit();await h.settle();assert.deepEqual(JSON.parse(h.calls[1].get('placeContext')),context);
 h=harness({draftOwnerId:'synthetic-owner',sessionId:'context-day'},storage);h.submit();await h.settle();assert.deepEqual(JSON.parse(h.calls[0].get('placeContext')),context);
 const changed=harness({initialPlaceContext:context,initialPavilionId:'garden'});changed.type('food');changed.location('garden');changed.change('title','Changed');changed.submit();await changed.settle();assert.equal(changed.calls[0].get('placeContext'),'');
});


test('source confirmation saves place name, title and context together in the restored draft',async()=>{const context={version:1,event_id:'e60f2360-8147-4112-969a-00954596ceb6',source_catalog_version:'a'.repeat(64),source_place_id:'organizer-hanameguri',subplace_source_id:null,indoor_occurrence_id:null};const storage=memoryStorage();let h=harness({draftOwnerId:'atomic-draft',sessionId:'source-day'},storage);h.context('garden',context);const expected=h.value('pavilion-search');assert(expected);h=harness({draftOwnerId:'atomic-draft',sessionId:'source-day'},storage);assert.equal(h.value('pavilion-search'),expected);h.submit();await h.settle();assert.equal(h.calls[0].get('title'),expected);assert.deepEqual(JSON.parse(h.calls[0].get('placeContext')),context);});


test('uncertain-save retry reuses its attempt ID across restored drafts and changed inputs',async()=>{const storage=memoryStorage();let h=harness({draftOwnerId:'retry-owner',sessionId:'retry-day'},storage);h.type('food');h.change('title','One meal');h.setAction(async()=>({status:'error',message:'network unknown',fieldErrors:{}}));h.submit();await h.settle();const id=h.calls[0].get('saveAttemptId');assert.match(id,/^[a-f0-9-]{36}$/);assert.equal(h.calls[0].get('saveAttemptChanged'),'false');h.submit();await h.settle();assert.equal(h.calls[1].get('saveAttemptId'),id);h=harness({draftOwnerId:'retry-owner',sessionId:'retry-day'},storage);h.change('title','Changed meal');h.setAction(async()=>({status:'error',message:'already saved',recoveryHref:'/sessions/day/activity-logs/log/edit',fieldErrors:{}}));h.submit();await h.settle();assert.equal(h.calls[0].get('saveAttemptId'),id);assert.equal(h.calls[0].get('saveAttemptChanged'),'true');assert.equal(h.value('title'),'Changed meal');});


test('a lost draft File cannot silently become a photo-less save without explicit removal',async()=>{const storage=memoryStorage(),props={draftOwnerId:'photo-loss',sessionId:'photo-loss-day'};let h=harness(props,storage);h.type('food');h.change('title','Photo meal');h.photo(new File(['dummy'],'meal.jpg',{type:'image/jpeg'}));h=harness(props,storage);h.submit();await h.settle();assert.equal(h.calls.length,0);assert.equal(h.value('title'),'Photo meal');h.removePhoto();h.submit();await h.settle();assert.equal(h.calls.length,1);assert.equal(h.calls[0].get('photo'),null);});


test('saving from a map returns to the selected place and visit date, and editing clears its draft',async()=>{const props={returnToMap:true,visitEventId:'event-a',visitDate:'2027-04-10',draftOwnerId:'map-return',mode:'edit',logId:'map-log',initialActivityType:'food',initialTitle:'Original'};const storage=memoryStorage();const h=harness(props,storage);h.change('title','Updated');h.location('garden');h.submit();await h.settle();assert(h.navigation.some(href=>href.startsWith('/collection-next?')&&href.includes('event=event-a')&&href.includes('place=garden')&&href.includes('day=2027-04-10')));assert(![...storage.data.keys()].some(key=>key.includes('edit%3Amap-log')&&!key.endsWith(':active')));});

test('synthetic photo to failed save, retry, map reread and edit preserves place and selected day', async () => {
  // In-memory server action only. No fetch, Storage upload, database or real GPS.
  const records = new Map();
  const sessions = [{id:'test-session',visit_date:'2027-04-10',event_id:'event-a'},{id:'next-day',visit_date:'2027-05-12',event_id:'event-a'}];
  const props = {returnToMap:true,visitEventId:'event-a',visitDate:'2027-04-10',visitSessions:sessions};
  const h = harness(props);
  h.type('food'); h.change('title','Synthetic lunch');
  const image = new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+afoQAAAAASUVORK5CYII=','base64')],'synthetic-camera.png',{type:'image/png'});
  h.photo(image); h.location('garden'); h.photo(null);
  h.change('related-place',''); h.location('garden');
  h.change('recording-session','next-day');
  let finish, began;
  const started=new Promise(resolve=>{began=resolve;});
  h.setAction(()=>new Promise(resolve=>{finish=resolve;began();}));
  h.submit(); h.submit();
  await started;
  assert.equal(h.calls.length,1);
  finish({status:'error',message:'offline',fieldErrors:{}}); await h.settle();
  assert.equal(h.value('title'),'Synthetic lunch'); assert.equal(h.fileInput.files[0],image);
  h.setAction(async data=>{const id=data.get('saveAttemptId');records.set(id,{id,session_id:data.get('sessionId'),pavilion_id:data.get('pavilionId'),activity_type:data.get('activityType'),title:data.get('title'),photo_path:'synthetic-only.png',occurred_at:null,created_at:'2027-05-12T03:00:00Z'});return {status:'success',message:'saved',fieldErrors:{}};});
  h.submit(); await h.settle();
  assert.equal(records.size,1);
  const record=[...records.values()][0];
  const target=new URL(h.navigation.at(-1),'https://example.invalid');
  assert.equal(target.searchParams.get('place'),'garden'); assert.equal(target.searchParams.get('day'),'2027-05-12');
  assert.equal(target.hash,'#memory-entry-'+record.id);
  const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/memory-map.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
  const model=exports.buildMemoryMap([...records.values()],sessions,'2027-05-12');
  assert.equal(model.places[0].entries[0].title,'Synthetic lunch'); assert.equal(model.places[0].visited,false);
  const edit=harness({...props,sessionId:'next-day',visitDate:'2027-05-12',mode:'edit',logId:record.id,initialActivityType:'food',initialTitle:record.title,initialPavilionId:record.pavilion_id});
  edit.change('title','Edited lunch');
  edit.setAction(async data=>{records.set(record.id,{...record,title:data.get('title')});return {status:'success',message:'saved',fieldErrors:{}};});
  edit.submit();await edit.settle();
  assert.equal(records.size,1);assert.equal(records.get(record.id).title,'Edited lunch');
  const returned=new URL(edit.navigation.at(-1),'https://example.invalid');
  assert.equal(returned.searchParams.get('place'),'garden');assert.equal(returned.searchParams.get('day'),'2027-05-12');assert.equal(returned.hash,'#memory-entry-'+record.id);
});


test('photo preparation failure never submits original and retains all fields for explicit retry',async()=>{
 const image=new File(['raw GPS'],'camera.heic',{type:'image/heic'});
 const h=harness({},memoryStorage(),async()=>{throw Error('unsupported');});
 h.type('food');h.change('title','Keep meal');h.location('garden');h.photo(image);
 h.submit();await h.settle();
 assert.equal(h.calls.length,0);assert.equal(h.value('title'),'Keep meal');assert.equal(h.value('related-place'),'garden');assert.equal(h.fileInput.files[0],image);
 h.removePhoto();h.submit();await h.settle();assert.equal(h.calls.length,1);assert.equal(h.calls[0].get('photo'),null);
});
test('successful preparation sends only replacement pixels and keeps original for local suggestions',async()=>{
 const original=new File(['GPS ORIGINAL'],'camera.jpg',{type:'image/jpeg'}),prepared=new File(['PIXELS'],'memory.png',{type:'image/png'});
 const h=harness({},memoryStorage(),async input=>{assert.equal(input,original);return prepared;});
 h.type('food');h.change('title','Meal');h.photo(original);h.setAction(async()=>({status:'error',message:'offline',fieldErrors:{}}));h.submit();await h.settle();
 assert.equal(await h.calls[0].get('photo').text(),'PIXELS');assert.equal(h.fileInput.files[0],original);
});

test('photo conversion failure stops create and edit without sending original or discarding input',async()=>{
 for(const props of [{},{mode:'edit',logId:'log',initialActivityType:'food',initialTitle:'Meal'}]){
  const h=harness(props,memoryStorage(),async()=>{throw Error('cannot convert');});if(!props.mode){h.type('food');h.change('title','Meal');}
  const original=new File(['GPS original'],'raw.heic',{type:'image/heic'});h.photo(original);h.submit();await h.settle();
  assert.equal(h.calls.length,0);assert.equal(h.value('title'),'Meal');assert.equal(h.fileInput.files[0],original);
 }
});
test('only sanitized pixels leave create and edit forms; original stays local on save failure',async()=>{
 for(const props of [{},{mode:'edit',logId:'log',initialActivityType:'food',initialTitle:'Meal'}]){
  const original=new File(['GPS original'],'raw.jpg',{type:'image/jpeg'}),clean=new File(['pixels'],'memory.png',{type:'image/png'});
  const h=harness(props,memoryStorage(),async input=>{assert.equal(input,original);return clean;});if(!props.mode){h.type('food');h.change('title','Meal');}
  h.photo(original);h.setAction(async()=>({status:'error',message:'offline',fieldErrors:{}}));h.submit();await h.settle();
  assert.equal(await h.calls[0].get('photo').text(),'pixels');assert.equal(h.fileInput.files[0],original);
 }
});


test('manual photo point survives failed save and retry, returns to its record, and cancellation preserves prior fields',async()=>{
 const point={version:1,event_id:'e60f2360-8147-4112-969a-00954596ceb6',map_id:'green-expo-places-v1',map_revision:'3073fb3b299d73fe74c86ea12df767d45c4c6c42efb02a08162cb6643ff71fdc',x:.3,y:.4,source:'manual',placement:'manual',source_accuracy_m:null,confirmed:true};
 const h=harness({initialActivityType:'event_participation',visitEventId:point.event_id,visitDate:'2027-04-10',mapPointAvailable:true,returnToMap:true});h.change('title','Synthetic parade');h.photo(new File(['synthetic'],'synthetic.png',{type:'image/png'}));h.openPoint();h.cancelPoint();assert.equal(h.value('title'),'Synthetic parade');h.openPoint();h.confirmPoint(point);
 h.setAction(async()=>({status:'error',message:'simulated upload failure',fieldErrors:{}}));h.submit();await h.settle();assert.equal(JSON.parse(h.calls[0].get('mapPoint')).x,.3);assert.equal(h.value('title'),'Synthetic parade');
 h.setAction(async()=>({status:'success',message:'saved',fieldErrors:{}}));h.submit();await h.settle();assert.equal(JSON.parse(h.calls[1].get('mapPoint')).y,.4);assert(h.calls[1].get('photo') instanceof File);assert(h.navigation.at(-1).includes('place=point%3A'));assert(h.navigation.at(-1).includes('day=2027-04-10'));
});
test('deferred point serializes explicit clearing, facility choice clears it, and disabled feature never submits a point',async()=>{
 const point={version:1,event_id:'e60f2360-8147-4112-969a-00954596ceb6',map_id:'green-expo-places-v1',map_revision:'3073fb3b299d73fe74c86ea12df767d45c4c6c42efb02a08162cb6643ff71fdc',x:.3,y:.4,source:'manual',placement:'manual',source_accuracy_m:null,confirmed:true};
 const h=harness({initialActivityType:'food',visitEventId:point.event_id,mapPointAvailable:true});h.change('title','Food');h.openPoint();h.confirmPoint(point);h.deferPoint();h.submit();await h.settle();assert.equal(h.calls[0].get('mapPoint'),'');
 const facility=harness({initialActivityType:'food',visitEventId:point.event_id,mapPointAvailable:true});facility.change('title','Food');facility.openPoint();facility.confirmPoint(point);facility.selectPavilion();facility.submit();await facility.settle();assert.equal(facility.calls[0].get('mapPoint'),'');assert.equal(facility.calls[0].get('pavilionId'),'garden');
 const disabled=harness({initialActivityType:'food',mapPointAvailable:false});disabled.change('title','Food');disabled.submit();await disabled.settle();assert.equal(disabled.calls[0].has('mapPoint'),false);
});


test('photo-derived point is cleared on photo removal while manual location remains, and point changes mark uncertain retry',async()=>{
 const base={version:1,event_id:'e60f2360-8147-4112-969a-00954596ceb6',map_id:'green-expo-places-v1',map_revision:'3073fb3b299d73fe74c86ea12df767d45c4c6c42efb02a08162cb6643ff71fdc',x:.3,y:.4,source:'photo-exif',placement:'projected',source_accuracy_m:null,confirmed:true};
 for(const source of ['photo-exif','manual']){
  const h=harness({initialActivityType:'event_participation',visitEventId:base.event_id,mapPointAvailable:true});h.change('title','Synthetic');h.photo(new File(['pixels'],'test.png',{type:'image/png'}));h.openPoint();h.confirmPoint({...base,source,placement:source==='manual'?'manual':'projected'});h.removePhoto();h.setAction(async()=>({status:'error',message:'unknown result',fieldErrors:{}}));h.submit();await h.settle();
  assert.equal(Boolean(h.calls[0].get('mapPoint')),source==='manual');const id=h.calls[0].get('saveAttemptId');h.openPoint();h.confirmPoint({...base,source:'manual',placement:'manual',x:.6});h.submit();await h.settle();assert.equal(h.calls[1].get('saveAttemptId'),id);assert.equal(h.calls[1].get('saveAttemptChanged'),'true');
 }
});


test('camera entry carries its original File and confirmed point through upload failure and retry',async()=>{
 const point={version:1,event_id:'e60f2360-8147-4112-969a-00954596ceb6',map_id:'green-expo-places-v1',map_revision:'3073fb3b299d73fe74c86ea12df767d45c4c6c42efb02a08162cb6643ff71fdc',x:.35,y:.59,source:'manual',placement:'manual',source_accuracy_m:null,confirmed:true};
 const photo=new File(['synthetic camera'],'camera.png',{type:'image/png'});const h=harness({sessionId:'camera-day',initialPhoto:photo,initialMapPoint:point,initialActivityType:'event_participation',initialTitle:'Camera',visitEventId:point.event_id,mapPointAvailable:true,returnToMap:true});
 h.setAction(async()=>({status:'error',message:'offline',fieldErrors:{}}));h.submit();await h.settle();assert.equal(h.calls[0].get('photo'),photo);assert.equal(JSON.parse(h.calls[0].get('mapPoint')).x,.35);assert.equal(h.fileInput.files[0],photo);h.setAction(async()=>({status:'success',message:'saved',fieldErrors:{}}));h.submit();await h.settle();assert.equal(h.calls[1].get('photo'),photo);assert(h.navigation.at(-1).includes('place=point%3A'));
});

test('capture completion is notified only after a successful save, never after failure',async()=>{let completed=0;const h=harness({initialActivityType:'food',initialTitle:'Synthetic',returnToMap:true,onSaveComplete:()=>completed++});h.setAction(async()=>({status:'error',message:'offline',fieldErrors:{}}));h.submit();await h.settle();assert.equal(completed,0);h.setAction(async()=>({status:'success',message:'saved',fieldErrors:{}}));h.submit();await h.settle();assert.equal(completed,1);assert.equal(h.navigation.length,1);});

test('photo save preserves cumulative or selected map scope independently of recording day',async()=>{for(const scope of [null,'2027-05-12']){const h=harness({initialActivityType:'event_participation',initialTitle:'Photo',returnToMap:true,returnMapDate:scope});h.submit();await h.settle();const url=new URL(h.navigation[0],'https://example.test');assert.equal(url.searchParams.get('day'),scope);}});

test('photo form starts with category, facility suggestions and optional details collapsed',()=>{const h=harness({photoEntry:true,initialActivityType:'event_participation',initialTitle:'Photo'});const groups=h.disclosures();assert.equal(groups.length>=4,true);assert.equal(groups.filter(g=>g.open===true).length,1,'only the empty photo picker is expanded');assert.equal(h.value('title'),'Photo');});

test('photo location copy explains the action without registry implementation jargon',()=>{const h=harness({photoEntry:true,initialActivityType:'event_participation',initialTitle:'Photo',visitEventId:'e60f2360-8147-4112-969a-00954596ceb6',mapPointAvailable:true});assert.doesNotMatch(h.text(),/公式台帳|同一性|達成対象/);assert.match(h.text(),/場所を選ばず、写真だけでも保存できます/);});
