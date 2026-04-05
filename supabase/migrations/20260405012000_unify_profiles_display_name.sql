alter table public.profiles
  add column if not exists display_name text;

update public.profiles
set display_name = nickname
where display_name is null
  and nickname is not null;

alter table public.profiles
  alter column display_name set not null;

alter table public.profiles
  drop column if exists nickname;
