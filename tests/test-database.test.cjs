/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node/Postgres regression tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const dir = 'testing/supabase/migrations';
const readMigration = suffix => fs.readFileSync(path.join(dir, fs.readdirSync(dir).find(f => f.endsWith(suffix))), 'utf8');
const grants = fs.readFileSync('supabase/data-api-grants.sql', 'utf8');
const owner = 'a0000000-0000-4000-8000-000000000001';
const other = 'a0000000-0000-4000-8000-000000000002';
const event = '10000000-0000-4000-8000-000000000001';
const session = 'b0000000-0000-4000-8000-000000000001';
const log = 'c0000000-0000-4000-8000-000000000001';

test('fresh isolated PostgreSQL enforces explicit grants and ownership RLS', async t => {
  const db = new PGlite();
  try {
    // Only service schemas/functions are minimal stand-ins. Public schema,
    // policies, cleanup SQL and grants are the same files used by the local stack.
    // No network, database URL, real users, passwords or production data are used.
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth, public to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean);
      create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text);
      alter table storage.objects enable row level security;
      create function storage.foldername(text) returns text[] language sql immutable as $$
        select (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'), 1)-1]
      $$;
    `);
    await t.test('missing baseline raises before any GRANT', async () => {
      await assert.rejects(db.exec(grants), /Missing public.events table or RLS/);
      await db.exec('rollback');
    });
    await db.exec(readMigration('_test_baseline.sql'));
    await db.exec(readMigration('_test_photo_cleanup.sql'));
    await db.exec(fs.readFileSync('testing/supabase/seed.sql', 'utf8'));
    async function as(role, user, sql) {
      assert.ok(['anon', 'authenticated'].includes(role));
      await db.exec(`set role ${role}`);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
      try { return await db.query(sql); }
      finally { await db.exec('reset role'); }
    }
    await t.test('RLS alone does not grant table access', async () => {
      await assert.rejects(as('anon', null, 'select * from public.events'), /permission denied/);
    });
    await db.exec(grants);
    await db.exec(grants); // Repeat application must remain safe.
    await t.test('nine-table ACLs match allowed and denied operations', async () => {
      for (const table of ['events','areas','countries','spots','pavilions','pavilion_aliases','profiles','visit_sessions','activity_logs']) {
        for (const role of ['anon','authenticated','service_role']) {
          for (const op of ['SELECT','INSERT','UPDATE','DELETE']) {
            const { rows } = await db.query('select has_table_privilege($1, $2, $3) as allowed', [role, `public.${table}`, op]);
            const master = ['events','areas','pavilions','pavilion_aliases'].includes(table);
            const userTable = ['profiles','visit_sessions','activity_logs'].includes(table);
            const expected = role === 'authenticated'
              ? op === 'SELECT' || userTable && (op !== 'DELETE' || table !== 'profiles')
              : role === 'anon' && master && op === 'SELECT';
            assert.equal(rows[0].allowed, expected, `${role} ${table} ${op}`);
          }
        }
      }
    });
    await t.test('anonymous master and nested alias reads work; writes and private reads fail', async () => {
      for (const table of ['events','areas','pavilions','pavilion_aliases']) {
        assert.equal((await as('anon', null, `select * from public.${table}`)).rows.length, 1);
        await assert.rejects(as('anon', null, `delete from public.${table}`), /permission denied/);
      }
      assert.equal((await as('anon', null, 'select p.id, a.alias from public.pavilions p join public.pavilion_aliases a on a.pavilion_id=p.id')).rows.length, 1);
      for (const table of ['countries','spots','profiles','visit_sessions','activity_logs']) {
        await assert.rejects(as('anon', null, `select * from public.${table}`), /permission denied/);
      }
      for (const table of ['countries','spots']) {
        assert.equal((await as('authenticated', owner, `select * from public.${table}`)).rows.length, 1);
        await assert.rejects(as('authenticated', owner, `delete from public.${table}`), /permission denied/);
      }
    });
    await db.query('insert into auth.users(id) values ($1),($2)', [owner,other]);
    await t.test('profile insert/update/select stay owner-only; delete is not granted', async () => {
      await as('authenticated', owner, `insert into public.profiles(id,display_name) values ('${owner}','Dummy A')`);
      await as('authenticated', other, `insert into public.profiles(id,display_name) values ('${other}','Dummy B')`);
      assert.equal((await as('authenticated', owner, 'select * from public.profiles')).rows.length, 1);
      await assert.rejects(as('authenticated', owner, `update public.profiles set id='${other}' where id='${owner}'`), /row-level security|duplicate key/);
      await assert.rejects(as('authenticated', owner, 'delete from public.profiles'), /permission denied/);
      await as('authenticated', owner, `update public.profiles set display_name='Dummy A2' where id='${owner}'`);
    });
    await t.test('sessions and logs allow own CRUD but deny forged ownership and hide peer rows', async () => {
      await as('authenticated', owner, `insert into public.visit_sessions(id,user_id,event_id,visit_date) values ('${session}','${owner}','${event}','2027-01-02')`);
      await as('authenticated', owner, `insert into public.activity_logs(id,session_id,user_id,event_id,activity_type,title) values ('${log}','${session}','${owner}','${event}','food','Dummy lunch')`);
      for (const table of ['visit_sessions','activity_logs']) {
        assert.equal((await as('authenticated', other, `select * from public.${table}`)).rows.length, 0);
        assert.equal((await as('authenticated', other, `delete from public.${table} returning id`)).rows.length, 0);
        await assert.rejects(as('authenticated', owner, `update public.${table} set user_id='${other}'`), /row-level security/);
        assert.equal((await as('authenticated', owner, `update public.${table} set memo='dummy memo' returning id`)).rows.length, 1);
      }
      await assert.rejects(as('authenticated', other, `insert into public.visit_sessions(user_id,event_id,visit_date) values ('${owner}','${event}','2027-01-03')`), /row-level security/);
      await assert.rejects(as('authenticated', other, `insert into public.activity_logs(session_id,user_id,event_id,activity_type,title) values ('${session}','${owner}','${event}','food','forged')`), /row-level security/);
      assert.equal((await as('authenticated', owner, 'delete from public.activity_logs returning id')).rows.length, 1);
      assert.equal((await as('authenticated', owner, 'delete from public.visit_sessions returning id')).rows.length, 1);
    });
    await t.test('local migrations use the canonical cleanup and grant SQL unchanged', () => {
      assert.equal(readMigration('_test_photo_cleanup.sql'), fs.readFileSync('supabase/migrations/20261018090300_guard_activity_photo_cleanup.sql', 'utf8'));
      assert.equal(readMigration('_test_data_api_grants.sql'), grants);
    });
  } finally { await db.close(); }
});
