-- Run only against a separately identified new/preview/test database.
-- Prerequisites: create all nine tables, enable RLS and restore their reviewed
-- policies first, then apply this file as the table owner (after migrations).
-- This is not a baseline, migration-history repair, or production rollout.
begin;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'events', 'areas', 'countries', 'spots', 'pavilions',
    'pavilion_aliases', 'visit_sessions', 'activity_logs', 'profiles'
  ] loop
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name
        and c.relkind in ('r', 'p') and c.relrowsecurity
    ) then
      raise exception 'Missing public.% table or RLS; restore the reviewed baseline first', table_name;
    end if;
    if not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = table_name
    ) then
      raise exception 'Missing policies for public.%; restore reviewed policies first', table_name;
    end if;
  end loop;
end
$$;

-- Public master reads used by the anonymous publicSupabase client.
grant select on table public.events to anon, authenticated;
grant select on table public.areas to anon, authenticated;
grant select on table public.pavilions to anon, authenticated;
grant select on table public.pavilion_aliases to anon, authenticated;
-- Existing authenticated-only master read policies; no direct app query today.
grant select on table public.countries to authenticated;
grant select on table public.spots to authenticated;
-- Signed-in user data; ownership remains enforced by the existing RLS policies.
grant select, insert, update, delete on table public.visit_sessions to authenticated;
grant select, insert, update, delete on table public.activity_logs to authenticated;
grant select, insert, update on table public.profiles to authenticated;

commit;
