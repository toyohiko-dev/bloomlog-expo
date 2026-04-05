alter table public.activity_logs
  add column if not exists photo_path text;

insert into storage.buckets (id, name, public)
values ('activity-photos', 'activity-photos', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'activity_photos_insert_own'
  ) then
    create policy activity_photos_insert_own
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'activity-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'activity_photos_update_own'
  ) then
    create policy activity_photos_update_own
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'activity-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'activity-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'activity_photos_delete_own'
  ) then
    create policy activity_photos_delete_own
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'activity-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;
