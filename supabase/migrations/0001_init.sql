-- matchd initial schema
-- Apply in the Supabase SQL editor, or via the Supabase CLI:
--   supabase db push
--
-- Player-level ratings are intentionally omitted. When we add them later,
-- they will hang off matches (and a future players / appearances table),
-- not replace match_ratings.

create extension if not exists pgcrypto;

create type public.match_status as enum (
  'scheduled',
  'live',
  'finished',
  'postponed',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username) between 2 and 30),
  constraint username_format check (username ~ '^[a-z0-9_]+$')
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  short_name text,
  country text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  short_name text,
  crest_url text,
  country text,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  competition_id uuid not null references public.competitions (id),
  home_team_id uuid not null references public.teams (id),
  away_team_id uuid not null references public.teams (id),
  kickoff_at timestamptz not null,
  status public.match_status not null default 'scheduled',
  home_score smallint,
  away_score smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_teams check (home_team_id <> away_team_id),
  constraint scores_together check (
    (home_score is null and away_score is null)
    or (home_score is not null and away_score is not null)
  ),
  constraint scores_nonnegative check (
    (home_score is null or home_score >= 0)
    and (away_score is null or away_score >= 0)
  )
);

-- One rating per user per match. Half-star steps from 0.5 to 5.0.
create table public.match_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  rating numeric(2, 1) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_ratings_user_match unique (user_id, match_id),
  constraint rating_range check (rating >= 0.5 and rating <= 5.0),
  constraint rating_half_steps check (rating * 2 = floor(rating * 2))
);

-- Reviews are separate from ratings so a user can rate without writing.
-- Join on (user_id, match_id) when you need both.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_user_match unique (user_id, match_id),
  constraint review_body_length check (char_length(body) between 1 and 5000)
);

create index matches_kickoff_at_idx on public.matches (kickoff_at desc);
create index matches_competition_id_idx on public.matches (competition_id);
create index matches_status_idx on public.matches (status);
create index match_ratings_match_id_idx on public.match_ratings (match_id);
create index reviews_match_id_idx on public.reviews (match_id);
create index reviews_user_id_idx on public.reviews (user_id);

create or replace view public.match_rating_stats
with (security_invoker = true) as
select
  match_id,
  round(avg(rating), 1) as average_rating,
  count(*)::int as rating_count
from public.match_ratings
group by match_id;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create trigger match_ratings_updated_at
  before update on public.match_ratings
  for each row execute function public.set_updated_at();

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Create a profile row when a user signs up.
-- Username comes from auth metadata, or a stable fallback.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      nullif(lower(new.raw_user_meta_data->>'username'), ''),
      'user_' || substr(replace(new.id::text, '-', ''), 1, 8)
    ),
    nullif(new.raw_user_meta_data->>'display_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.match_ratings enable row level security;
alter table public.reviews enable row level security;

create policy "profiles are readable"
  on public.profiles for select
  using (true);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "competitions are readable"
  on public.competitions for select
  using (true);

create policy "teams are readable"
  on public.teams for select
  using (true);

create policy "matches are readable"
  on public.matches for select
  using (true);

create policy "ratings are readable"
  on public.match_ratings for select
  using (true);

create policy "users can write own ratings"
  on public.match_ratings for insert
  with check (auth.uid() = user_id);

create policy "users can update own ratings"
  on public.match_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own ratings"
  on public.match_ratings for delete
  using (auth.uid() = user_id);

create policy "reviews are readable"
  on public.reviews for select
  using (true);

create policy "users can write own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Sports catalog tables have no client write policies.
-- Sync jobs will use the service role, which bypasses RLS.
