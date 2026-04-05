alter table public.profiles
add column if not exists nickname text;

alter table public.profiles
add column if not exists created_at timestamptz not null default now();

alter table public.profiles
add column if not exists updated_at timestamptz not null default now();