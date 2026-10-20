/* eslint-disable @typescript-eslint/no-require-imports -- Explicit opt-in local Supabase/Auth/Storage integration. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createServerClient } = require('@supabase/ssr');
const { createClient } = require('@supabase/supabase-js');
const { checkTestEnv } = require('./run-app.cjs');
async function main() {
  checkTestEnv(process.env);
  if (process.env.BLOOMLOG_ALLOW_LOCAL_AUTH_TEST !== '1') {
    throw new Error('Explicit approval for synthetic local Auth accounts is required. Set BLOOMLOG_ALLOW_LOCAL_AUTH_TEST=1 only after approval.');
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anon = createClient(url, key, {auth:{persistSession:false, autoRefreshToken:false}});
  const eventId='10000000-0000-4000-8000-000000000001';
  for (const table of ['events','areas','pavilions','pavilion_aliases']) {
    const {data,error}=await anon.from(table).select('*');
    if(error || !data?.length) throw new Error(`Public master read failed: ${table}`);
  }
  for (const table of ['profiles','visit_sessions','activity_logs','countries','spots']) {
    const {error}=await anon.from(table).select('*');
    assert.ok(Boolean(error), `Anonymous read must be denied: ${table}`);
  }
  async function syntheticActor(label) {
    let cookies=[];
    const client=createServerClient(url,key,{cookies:{getAll:()=>cookies,setAll:items=>{cookies=items;}}});
    const {data,error}=await client.auth.signUp({
      email:`bloomlog-${label}-${randomUUID()}@example.test`,
      password:`TestOnly-${randomUUID()}!`,
    });
    if(error || !data.session || !data.user) throw new Error('Local Auth signup failed; require local email confirmations disabled.');
    const user=data.user;
    const {error:profileError}=await client.from('profiles').insert({id:user.id,display_name:`Dummy ${label}`});
    if(profileError) throw new Error('Synthetic profile insert failed.');
    return {client,user,cookie:()=>cookies.map(c=>`${c.name}=${c.value}`).join('; ')};
  }
  const a=await syntheticActor('A');
  const b=await syntheticActor('B');
  const sessionId=randomUUID(), logId=randomUUID();
  const {error:sessionError}=await a.client.from('visit_sessions').insert({
    id:sessionId,user_id:a.user.id,event_id:eventId,visit_date:'2027-01-02',title:'Dummy local integration',
  });
  if(sessionError) throw new Error('Synthetic session insert failed; reset the disposable stack before rerunning.');
  const photoPath=`${a.user.id}/${sessionId}/${randomUUID()}.png`;
  // A generated one-pixel dummy image, never a user's photo.
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=','base64');
  const {error:uploadError}=await a.client.storage.from('activity-photos').upload(photoPath,png,{contentType:'image/png'});
  if(uploadError) throw new Error('Local dummy image upload failed.');
  const {error:logError}=await a.client.from('activity_logs').insert({
    id:logId,session_id:sessionId,event_id:eventId,user_id:a.user.id,activity_type:'food',title:'Dummy lunch',photo_path:photoPath,
  });
  if(logError) throw new Error('Synthetic activity insert failed.');
  const {data:peerRows,error:peerError}=await b.client.from('activity_logs').select('id').eq('id',logId);
  assert.equal(Boolean(peerError),false);
  assert.equal(peerRows.length,0);
  const {error:forgedInsert}=await b.client.from('activity_logs').insert({
    session_id:sessionId,event_id:eventId,user_id:a.user.id,activity_type:'food',title:'forged',
  });
  assert.ok(Boolean(forgedInsert),'Forged ownership must be denied.');
  const {data:claimWhileReferenced,error:claimError}=await a.client.rpc('claim_activity_photo_cleanup',{p_path:photoPath});
  assert.equal(Boolean(claimError),false);
  assert.equal(claimWhileReferenced,false);
  const page=await fetch('http://127.0.0.1:3100/sessions',{headers:{cookie:a.cookie()},redirect:'manual'});
  assert.equal(page.status,200,'Authenticated isolated app route must render.');
  assert.ok((await page.text()).includes('Dummy local integration'));
  const {error:deleteLog}=await a.client.from('activity_logs').delete().eq('id',logId);
  if(deleteLog) throw new Error('Own synthetic activity delete failed.');
  const {data:claimed,error:cleanupError}=await a.client.rpc('claim_activity_photo_cleanup',{p_path:photoPath});
  assert.equal(Boolean(cleanupError),false);
  assert.equal(claimed,true);
  const {error:removeError}=await a.client.storage.from('activity-photos').remove([photoPath]);
  if(removeError) throw new Error('Local dummy image removal failed.');
  const {error:deleteSession}=await a.client.from('visit_sessions').delete().eq('id',sessionId);
  if(deleteSession) throw new Error('Own synthetic session delete failed.');
  await a.client.auth.signOut(); await b.client.auth.signOut();
  console.log('PASS: isolated app + Auth + Data API + Storage + cleanup RPC. Synthetic accounts remain only in the disposable local stack; reset it before rerunning.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
