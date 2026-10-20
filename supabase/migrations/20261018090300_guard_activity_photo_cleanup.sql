-- Only photo lifecycle: no changes to existing activity rows or objects.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table private.activity_photo_cleanup (
  photo_path text primary key,
  owner_id uuid not null,
  claimed_at timestamptz not null default now()
);
alter table private.activity_photo_cleanup enable row level security;
revoke all on private.activity_photo_cleanup from public, anon, authenticated;

-- VOLATILE + READ COMMITTED: take a fresh snapshot after the shared path lock.
create function private.claim_activity_photo_cleanup(p_path text)
returns boolean language plpgsql volatile security definer
set search_path = '' set row_security = off set lock_timeout = '3s'
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or p_path is null
    or split_part(p_path, '/', 1) <> actor::text
    or p_path like '%..%' then return false; end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Photo cleanup requires READ COMMITTED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('activity-photo:' || p_path, 0));
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'activity-photos' and name = p_path and owner_id = actor::text
  ) then return false; end if;
  -- Deliberately checks all rows, including rows invisible to the caller's RLS.
  if exists (select 1 from public.activity_logs where photo_path = p_path) then
    return false;
  end if;
  insert into private.activity_photo_cleanup(photo_path, owner_id)
  values(p_path, actor) on conflict (photo_path) do nothing;
  return exists (
    select 1 from private.activity_photo_cleanup
    where photo_path = p_path and owner_id = actor
  );
end;
$$;

create function public.claim_activity_photo_cleanup(p_path text)
returns boolean language sql volatile security invoker set search_path = ''
as $$ select private.claim_activity_photo_cleanup(p_path) $$;

create function private.guard_activity_photo_reference()
returns trigger language plpgsql volatile security definer
set search_path = '' set row_security = off set lock_timeout = '3s'
as $$
begin
  if new.photo_path is null then return new; end if;
  if tg_op = 'UPDATE' then
    if new.photo_path is not distinct from old.photo_path
       and new.user_id is not distinct from old.user_id then return new; end if;
  end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Photo reference requires READ COMMITTED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('activity-photo:' || new.photo_path, 0));
  if new.user_id is null
    or split_part(new.photo_path, '/', 1) <> new.user_id::text
    or exists (select 1 from private.activity_photo_cleanup where photo_path = new.photo_path)
    or not exists (
      select 1 from storage.objects
      where bucket_id = 'activity-photos' and name = new.photo_path
        and owner_id = new.user_id::text
    ) then
    raise exception 'Photo reference is unavailable' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger guard_activity_photo_reference
before insert or update of photo_path, user_id on public.activity_logs
for each row execute function private.guard_activity_photo_reference();

create function private.can_remove_activity_photo(p_path text)
returns boolean language sql stable security definer
set search_path = '' set row_security = off
as $$
  select auth.uid() is not null and exists (
    select 1 from private.activity_photo_cleanup
    where photo_path = p_path and owner_id = auth.uid()
  )
$$;

revoke all on function private.claim_activity_photo_cleanup(text) from public, anon, authenticated;
revoke all on function public.claim_activity_photo_cleanup(text) from public, anon, authenticated;
revoke all on function private.guard_activity_photo_reference() from public, anon, authenticated;
revoke all on function private.can_remove_activity_photo(text) from public, anon, authenticated;
grant execute on function private.claim_activity_photo_cleanup(text) to authenticated;
grant execute on function public.claim_activity_photo_cleanup(text) to authenticated;
grant execute on function private.can_remove_activity_photo(text) to authenticated;

-- Replace the permissive DELETE policy; do not merely add an OR-ed policy.
drop policy activity_photos_delete_own on storage.objects;
create policy activity_photos_delete_own on storage.objects
for delete to authenticated using (
  bucket_id = 'activity-photos'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
  and private.can_remove_activity_photo(name)
);
create policy activity_photos_select_cleanup on storage.objects
for select to authenticated using (
  bucket_id = 'activity-photos'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
  and private.can_remove_activity_photo(name)
);
