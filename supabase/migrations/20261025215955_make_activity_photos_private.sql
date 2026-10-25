begin;
do $$
begin
 if not exists(select 1 from storage.buckets where id='activity-photos' and public=true) then
   raise exception 'Unexpected bucket state: inspect before retry';
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
   and policyname='activity_photos_read_own_record' and cmd='SELECT'
   and roles=array['authenticated']::name[]) then
   raise exception 'Required owner-record SELECT policy is missing';
 end if;
end $$;
-- Approved release 891bed9 is READY; all four owner photos loaded through the authenticated route.
update storage.buckets set public=false where id='activity-photos' and public=true;
-- Existing objects/records/facilities/policies/grants remain unchanged.
commit;
