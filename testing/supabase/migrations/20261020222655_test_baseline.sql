-- TEST ONLY: metadata-derived snapshot, no production rows or auth identities.
-- Fresh Supabase database only. Do not mix with root historical migrations.
do $$ begin
  if exists (select 1 from pg_tables where schemaname = 'public') then
    raise exception 'Test baseline requires an empty public schema';
  end if;
end $$;

create table public.events (
  id uuid primary key default gen_random_uuid(), name text not null,
  slug text not null unique, start_date date not null, end_date date not null,
  description text, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.countries (
  id uuid primary key default gen_random_uuid(), name_ja text not null,
  name_en text, code text, created_at timestamptz not null default now()
);
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null, slug text not null, sort_order integer not null default 0,
  created_at timestamptz not null default now(), unique(event_id, slug)
);
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  name text not null, slug text, spot_type text not null
    check (spot_type in ('pavilion', 'food_booth', 'shop', 'event_stage', 'other')),
  description text, map_x numeric(8,2), map_y numeric(8,2),
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.pavilions (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  official_name text, country_id text, area_id text, spot_id text,
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  image_path text
);
create table public.pavilion_aliases (
  id uuid primary key default gen_random_uuid(),
  pavilion_id uuid not null references public.pavilions(id) on delete cascade,
  alias text not null, unique(pavilion_id, alias)
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.visit_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  visit_date date not null unique, title text, memo text,
  is_public boolean not null default false, created_at timestamptz not null default now(),
  unique(user_id, event_id, visit_date)
);
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.visit_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  activity_type text not null check (activity_type in ('pavilion_visit', 'food', 'pin', 'event_participation')),
  title text not null, memo text, image_url text,
  price integer check (price is null or price >= 0),
  acquisition_method text check (acquisition_method is null or acquisition_method in ('purchase','exchange','gift','other')),
  occurred_at timestamptz, is_public boolean not null default false,
  created_at timestamptz not null default now(),
  pavilion_id uuid references public.pavilions(id) on delete set null, photo_path text
);
create index activity_logs_pavilion_id_idx on public.activity_logs(pavilion_id);
create index pavilion_aliases_alias_idx on public.pavilion_aliases(alias);
create index pavilion_aliases_pavilion_id_idx on public.pavilion_aliases(pavilion_id);
create index pavilions_sort_order_idx on public.pavilions(sort_order, name);

alter table public.events enable row level security;
alter table public.areas enable row level security;
alter table public.countries enable row level security;
alter table public.spots enable row level security;
alter table public.pavilions enable row level security;
alter table public.pavilion_aliases enable row level security;
alter table public.profiles enable row level security;
alter table public.visit_sessions enable row level security;
alter table public.activity_logs enable row level security;
create policy events_read_all_public on public.events for select to anon, authenticated using (true);
create policy areas_read_all_anon on public.areas for select to anon using (true);
create policy areas_read_all_authenticated on public.areas for select to authenticated using (true);
create policy countries_read_all_authenticated on public.countries for select to authenticated using (true);
create policy spots_read_all_authenticated on public.spots for select to authenticated using (true);
create policy pavilions_read_all on public.pavilions for select to anon, authenticated using (true);
create policy pavilion_aliases_read_all on public.pavilion_aliases for select to anon, authenticated using (true);
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy visit_sessions_select_own on public.visit_sessions for select using (auth.uid() = user_id);
create policy visit_sessions_insert_own on public.visit_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy visit_sessions_update_own on public.visit_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy visit_sessions_delete_own on public.visit_sessions for delete using (auth.uid() = user_id);
create policy activity_logs_select_own on public.activity_logs for select using (auth.uid() = user_id);
create policy activity_logs_insert_own on public.activity_logs for insert to authenticated with check (auth.uid() = user_id);
create policy activity_logs_update_own on public.activity_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy activity_logs_delete_own on public.activity_logs for delete using (auth.uid() = user_id);

create function public.set_profiles_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- Same bucket contract as the app; isolated local instance, initially empty.
insert into storage.buckets(id, name, public) values ('activity-photos','activity-photos',true);
create policy activity_photos_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy activity_photos_update_own on storage.objects for update to authenticated
using (bucket_id = 'activity-photos' and name like auth.uid()::text || '/%')
with check (bucket_id = 'activity-photos' and name like auth.uid()::text || '/%');
-- Replaced by the canonical cleanup migration in the next test-only step.
create policy activity_photos_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text);
