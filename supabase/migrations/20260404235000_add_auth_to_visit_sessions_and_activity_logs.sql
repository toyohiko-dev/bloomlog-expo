alter table public.visit_sessions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.activity_logs
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists visit_sessions_user_id_visit_date_idx
  on public.visit_sessions (user_id, visit_date desc, created_at desc);

create index if not exists activity_logs_user_id_session_id_idx
  on public.activity_logs (user_id, session_id, created_at asc);

update public.activity_logs as logs
set user_id = sessions.user_id
from public.visit_sessions as sessions
where logs.session_id = sessions.id
  and logs.user_id is null
  and sessions.user_id is not null;

create or replace function public.assign_visit_session_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;

  if new.user_id is null then
    raise exception 'visit_sessions.user_id is required';
  end if;

  return new;
end;
$$;

drop trigger if exists set_visit_session_user_id on public.visit_sessions;

create trigger set_visit_session_user_id
before insert or update on public.visit_sessions
for each row
execute function public.assign_visit_session_user_id();

create or replace function public.sync_activity_log_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  session_user_id uuid;
begin
  select user_id
    into session_user_id
  from public.visit_sessions
  where id = new.session_id;

  if session_user_id is null then
    raise exception 'activity_logs.session_id must reference a user-owned visit_session';
  end if;

  if new.user_id is null then
    new.user_id := session_user_id;
  end if;

  if new.user_id is distinct from session_user_id then
    raise exception 'activity_logs.user_id must match visit_sessions.user_id';
  end if;

  return new;
end;
$$;

drop trigger if exists set_activity_log_user_id on public.activity_logs;

create trigger set_activity_log_user_id
before insert or update on public.activity_logs
for each row
execute function public.sync_activity_log_user_id();

alter table public.visit_sessions enable row level security;
alter table public.activity_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'visit_sessions'
      and policyname = 'visit_sessions_select_own'
  ) then
    create policy visit_sessions_select_own
      on public.visit_sessions
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'visit_sessions'
      and policyname = 'visit_sessions_insert_own'
  ) then
    create policy visit_sessions_insert_own
      on public.visit_sessions
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'visit_sessions'
      and policyname = 'visit_sessions_update_own'
  ) then
    create policy visit_sessions_update_own
      on public.visit_sessions
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'visit_sessions'
      and policyname = 'visit_sessions_delete_own'
  ) then
    create policy visit_sessions_delete_own
      on public.visit_sessions
      for delete
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'activity_logs'
      and policyname = 'activity_logs_select_own'
  ) then
    create policy activity_logs_select_own
      on public.activity_logs
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'activity_logs'
      and policyname = 'activity_logs_insert_own'
  ) then
    create policy activity_logs_insert_own
      on public.activity_logs
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'activity_logs'
      and policyname = 'activity_logs_update_own'
  ) then
    create policy activity_logs_update_own
      on public.activity_logs
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'activity_logs'
      and policyname = 'activity_logs_delete_own'
  ) then
    create policy activity_logs_delete_own
      on public.activity_logs
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from public.visit_sessions where user_id is null) then
    alter table public.visit_sessions
      alter column user_id set not null;
  end if;

  if not exists (select 1 from public.activity_logs where user_id is null) then
    alter table public.activity_logs
      alter column user_id set not null;
  end if;
end
$$;
