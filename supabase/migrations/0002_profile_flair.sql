-- Supporter flair: nationality and favorite club on profiles.

alter table public.profiles
  add column if not exists country_code text;

alter table public.profiles
  add column if not exists favorite_team_id uuid references public.teams (id) on delete set null;

alter table public.profiles
  drop constraint if exists profiles_country_code_format;

alter table public.profiles
  add constraint profiles_country_code_format check (
    country_code is null
    or country_code ~ '^[A-Z]{2}(-[A-Z]{2,3})?$'
  );

create index if not exists profiles_favorite_team_id_idx
  on public.profiles (favorite_team_id);
