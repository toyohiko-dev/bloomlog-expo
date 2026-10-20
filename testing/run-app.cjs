/* eslint-disable @typescript-eslint/no-require-imports -- Node launcher; no credentials are printed or written. */
const { spawn } = require('node:child_process');
function checkTestEnv(env) {
  if (env.NEXT_PUBLIC_BLOOMLOG_ENV !== 'test' ||
      env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:55321' ||
      !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Use the isolated local test URL, test mode and local anon key. Production fallback is forbidden.');
  }
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (key.startsWith('sb_secret_')) throw new Error('Server credentials are forbidden in the app.');
  if (key.split('.').length === 3) {
    let payload;
    try { payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()); }
    catch { throw new Error('Invalid local anon key.'); }
    if (payload.role !== 'anon' || payload.ref === 'xavnxklqsupkosmywojn') {
      throw new Error('Use only the isolated local anon key.');
    }
  }
}
module.exports = { checkTestEnv };
if (require.main === module) {
  try { checkTestEnv(process.env); }
  catch (error) { console.error(error.message); process.exit(1); }
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3100'], {
    stdio: 'inherit', env: process.env,
  });
  child.on('exit', code => process.exit(code ?? 1));
}
