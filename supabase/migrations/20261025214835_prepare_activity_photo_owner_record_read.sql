begin;
do $$
begin
 if not exists(select 1 from storage.buckets where id='activity-photos' and public=true) then
   raise exception 'Unexpected bucket state: inspect before preparation';
 end if;
 if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='activity_photos_read_own_record') then
   raise exception 'Policy already exists: inspect before retry';
 end if;
end $$;
create policy activity_photos_read_own_record
on storage.objects for select to authenticated
using (
 bucket_id='activity-photos'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.activity_logs a
   where a.user_id=(select auth.uid()) and a.photo_path=storage.objects.name)
);
-- No bucket change, grants, object writes, record writes, or existing policy changes.
commit;
