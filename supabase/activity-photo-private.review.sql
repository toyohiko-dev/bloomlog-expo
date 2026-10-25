-- REVIEW ONLY / NOT APPLIED. Target xavnxklqsupkosmywojn.
-- Owner-record SELECT was applied as 20261025214835_prepare_activity_photo_owner_record_read.
-- Do not run until the approved authenticated-image code is deployed and owner reads verified.
begin;
do $$
begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
   and policyname='activity_photos_read_own_record' and cmd='SELECT'
   and roles=array['authenticated']::name[]) then
  raise exception 'Required owner-record SELECT policy is missing';
 end if;
 if not exists(select 1 from storage.buckets where id='activity-photos' and public=true) then
  raise exception 'Unexpected bucket state; inspect before retry';
 end if;
end $$;
update storage.buckets set public=false where id='activity-photos' and public=true;
-- No object, record, facility, grant or existing-policy writes.
-- Verify owner display, anonymous/other-user denial, and unchanged data counts.
rollback;
-- Never automatically restore public visibility on failure.
