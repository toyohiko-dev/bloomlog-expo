alter table public.visit_sessions enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists visit_sessions_insert_dev on public.visit_sessions;
drop policy if exists activity_logs_insert_dev on public.activity_logs;

drop policy if exists visit_sessions_insert_own on public.visit_sessions;
create policy visit_sessions_insert_own
  on public.visit_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists activity_logs_insert_own on public.activity_logs;
create policy activity_logs_insert_own
  on public.activity_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);
