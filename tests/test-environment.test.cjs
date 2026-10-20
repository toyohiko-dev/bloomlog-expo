/* eslint-disable @typescript-eslint/no-require-imports -- Node-only launcher isolation tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { checkTestEnv } = require('../testing/run-app.cjs');
const local = { NEXT_PUBLIC_BLOOMLOG_ENV: 'test', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:55321', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy-local-public-key' };
test('test app requires its own endpoint, explicit mode and public key', () => {
  assert.doesNotThrow(() => checkTestEnv(local));
  for (const change of [
    { NEXT_PUBLIC_BLOOMLOG_ENV: undefined },
    { NEXT_PUBLIC_SUPABASE_URL: 'https://xavnxklqsupkosmywojn.supabase.co' },
    { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' },
    { NEXT_PUBLIC_SUPABASE_ANON_KEY: '' },
    { NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_secret_dummy' },
  ]) assert.throws(() => checkTestEnv({ ...local, ...change }));
  for (const payload of [{role:'service_role'}, {role:'anon',ref:'xavnxklqsupkosmywojn'}]) {
    const key = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
    assert.throws(() => checkTestEnv({ ...local, NEXT_PUBLIC_SUPABASE_ANON_KEY:key }));
  }
});
test('backup branch cannot automatically deploy and local API requires explicit grants', () => {
  assert.equal(JSON.parse(fs.readFileSync('vercel.json','utf8')).git.deploymentEnabled['codex/test-environment'], false);
  const config=fs.readFileSync('testing/supabase/config.toml','utf8');
  assert.match(config,/auto_expose_new_tables = false/);
  assert.match(config,/project_id = "bloomlog-test"/);
  assert.match(config,/port = 55321/);
  assert.doesNotMatch(config,/xavnxklqsupkosmywojn/);
  assert.match(fs.readFileSync('next.config.ts','utf8'),/\.next-test/);
  assert.doesNotMatch(fs.readFileSync('testing/run-app.cjs','utf8'),/\.env\.local/);
});
