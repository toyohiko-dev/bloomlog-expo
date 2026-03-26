create extension if not exists pgcrypto;

create table if not exists public.pavilions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  official_name text,
  country_id text,
  area_id text,
  spot_id text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pavilions_name_key unique (name)
);

create index if not exists pavilions_sort_order_idx
  on public.pavilions (sort_order asc, name asc);

alter table public.activity_logs
  add column if not exists pavilion_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activity_logs_pavilion_id_fkey'
  ) then
    alter table public.activity_logs
      add constraint activity_logs_pavilion_id_fkey
      foreign key (pavilion_id)
      references public.pavilions (id)
      on delete set null;
  end if;
end $$;

create index if not exists activity_logs_pavilion_id_idx
  on public.activity_logs (pavilion_id);

insert into public.pavilions (name, official_name)
select distinct trim(title), trim(title)
from public.activity_logs
where activity_type = 'pavilion_visit'
  and title is not null
  and trim(title) <> ''
on conflict (name) do nothing;

update public.activity_logs as logs
set pavilion_id = pavilions.id
from public.pavilions
where logs.activity_type = 'pavilion_visit'
  and logs.pavilion_id is null
  and logs.title is not null
  and trim(logs.title) <> ''
  and pavilions.name = trim(logs.title);
