create table if not exists public.f1_races (
  id text primary key,
  season integer not null,
  name text not null,
  circuit_name text,
  circuit_image text,
  country text,
  starts_at timestamptz not null,
  status text,
  winner_driver text,
  winner_team text,
  winner_driver_image text,
  driver_names text not null default '',
  sessions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.f1_race_ratings (
  id uuid primary key default gen_random_uuid(),
  race_id text not null references public.f1_races (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating numeric,
  created_at timestamptz not null default now(),
  constraint f1_race_ratings_user_race unique (user_id, race_id)
);

create index if not exists f1_races_starts_at_idx on public.f1_races (starts_at desc);

alter table public.f1_races enable row level security;
alter table public.f1_race_ratings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'f1_races' and policyname = 'f1 races are readable'
  ) then
    create policy "f1 races are readable" on public.f1_races for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'f1_race_ratings' and policyname = 'f1 ratings are readable'
  ) then
    create policy "f1 ratings are readable" on public.f1_race_ratings for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'f1_race_ratings' and policyname = 'users can write own f1 ratings'
  ) then
    create policy "users can write own f1 ratings" on public.f1_race_ratings for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'f1_race_ratings' and policyname = 'users can update own f1 ratings'
  ) then
    create policy "users can update own f1 ratings" on public.f1_race_ratings for update
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
