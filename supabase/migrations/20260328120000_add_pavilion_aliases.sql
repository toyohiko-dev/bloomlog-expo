create table if not exists public.pavilion_aliases (
  id uuid primary key default gen_random_uuid(),
  pavilion_id uuid not null references public.pavilions (id) on delete cascade,
  alias text not null
);

create index if not exists pavilion_aliases_pavilion_id_idx
  on public.pavilion_aliases (pavilion_id);

create index if not exists pavilion_aliases_alias_idx
  on public.pavilion_aliases (alias);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pavilion_aliases_pavilion_id_alias_key'
  ) then
    alter table public.pavilion_aliases
      add constraint pavilion_aliases_pavilion_id_alias_key
      unique (pavilion_id, alias);
  end if;
end $$;

-- Explicit Data API access; aliases are read-only to application roles.
alter table public.pavilion_aliases enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pavilion_aliases'
      and policyname = 'pavilion_aliases_read_all'
  ) then
    create policy pavilion_aliases_read_all on public.pavilion_aliases
      for select to anon, authenticated using (true);
  end if;
end
$$;
grant select on table public.pavilion_aliases to anon, authenticated;
