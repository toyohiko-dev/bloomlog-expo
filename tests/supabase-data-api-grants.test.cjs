/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS static SQL checks; no DB or network access. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sql = fs.readFileSync('supabase/data-api-grants.sql', 'utf8');
const expected = {
  events: ['select', 'anon, authenticated'],
  areas: ['select', 'anon, authenticated'],
  pavilions: ['select', 'anon, authenticated'],
  pavilion_aliases: ['select', 'anon, authenticated'],
  countries: ['select', 'authenticated'],
  spots: ['select', 'authenticated'],
  visit_sessions: ['select, insert, update, delete', 'authenticated'],
  activity_logs: ['select, insert, update, delete', 'authenticated'],
  profiles: ['select, insert, update', 'authenticated'],
};
test('all nine tables have exactly the reviewed application privileges', () => {
  const grants = [...sql.matchAll(/^grant (.+) on table public\.(\w+) to (.+);$/gm)];
  assert.equal(grants.length, 9);
  assert.deepEqual(Object.fromEntries(grants.map(([, privileges, table, roles]) =>
    [table, [privileges, roles]])), expected);
  assert.doesNotMatch(sql, /grant\s+all|on\s+all\s+tables|alter\s+default\s+privileges|\brevoke\b/i);
});
test('all prerequisites are checked before grants in one transaction', () => {
  const preflight = sql.slice(sql.indexOf('do $$'), sql.indexOf('grant select'));
  for (const table of Object.keys(expected)) assert.ok(preflight.includes(`'${table}'`));
  assert.match(preflight, /c\.relrowsecurity/);
  assert.match(preflight, /from pg_policies/);
  assert.match(preflight, /raise exception/g);
  assert.ok(sql.indexOf('begin;') < sql.indexOf('do $$'));
  assert.ok(sql.lastIndexOf('commit;') > sql.lastIndexOf('grant '));
});
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : /\.[tj]sx?$/.test(file) ? [file] : [];
  });
}
test('every literal application table query and nested alias read is covered', () => {
  const queried = new Set();
  for (const file of [...files('app'), ...files('lib')]) {
    const source = fs.readFileSync(file, 'utf8');
    for (const [, table] of source.matchAll(/\.from\("(\w+)"\)/g)) {
      queried.add(table);
      assert.ok(expected[table], `${file}: ${table} lacks a grant`);
    }
  }
  assert.deepEqual([...queried].sort(), ['activity_logs', 'areas', 'events', 'pavilions', 'profiles', 'visit_sessions']);
  assert.match(fs.readFileSync('lib/sessions.ts', 'utf8'), /pavilion_aliases\(alias\)/);
  assert.deepEqual(expected.pavilion_aliases, ['select', 'anon, authenticated']);
});

test('profile trigger rebuild source preserves reviewed invoker and fixed search path', () => {
  const source = fs.readFileSync('supabase/migrations/20260405003000_add_profiles.sql', 'utf8');
  const declaration = source.match(/create or replace function public\.set_profiles_updated_at\(\)([\s\S]*?)as \$\$/i)?.[1];
  assert.ok(declaration, 'profile trigger function must exist');
  assert.match(declaration, /returns trigger/i);
  assert.match(declaration, /security invoker/i);
  assert.match(declaration, /set search_path\s*=\s*public/i);
  assert.doesNotMatch(declaration, /security definer/i);
  assert.match(source, /new\.updated_at := now\(\);/);
  assert.match(source, /before update on public\.profiles[\s\S]*?execute function public\.set_profiles_updated_at\(\);/i);
});
