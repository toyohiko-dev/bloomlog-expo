alter table public.pavilions enable row level security;
alter table public.pavilion_aliases enable row level security;

revoke all privileges on table public.pavilions from anon, authenticated;
revoke all privileges on table public.pavilion_aliases from anon, authenticated;

grant select on table public.pavilions to anon, authenticated;
grant select on table public.pavilion_aliases to anon, authenticated;

grant all on table public.pavilions to service_role;
grant all on table public.pavilion_aliases to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pavilions'
      and policyname = 'pavilions_read_all'
  ) then
    create policy pavilions_read_all
      on public.pavilions
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pavilion_aliases'
      and policyname = 'pavilion_aliases_read_all'
  ) then
    create policy pavilion_aliases_read_all
      on public.pavilion_aliases
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;
