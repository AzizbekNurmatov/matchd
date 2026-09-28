-- Matches the UFC tables already used by the app.
-- create-if-not-exists so this is a no-op when those tables are present.

create table if not exists public.ufc_events (
  id text primary key,
  title text not null,
  date timestamptz not null,
  venue text,
  status text default 'UPCOMING',
  created_at timestamptz not null default now()
);

create table if not exists public.ufc_fights (
  id text primary key,
  event_id text references public.ufc_events (id) on delete cascade,
  order_index integer not null,
  weight_class text not null,
  fighter_a_name text not null,
  fighter_a_image text,
  fighter_b_name text not null,
  fighter_b_image text,
  winner_id text,
  method text,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.ufc_fight_ratings (
  id uuid primary key default gen_random_uuid(),
  fight_id text references public.ufc_fights (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  rating numeric,
  review text,
  created_at timestamptz not null default now(),
  constraint ufc_fight_ratings_user_fight unique (user_id, fight_id)
);

create index if not exists ufc_events_date_idx on public.ufc_events (date desc);
create index if not exists ufc_fights_event_order_idx
  on public.ufc_fights (event_id, order_index desc);

alter table public.ufc_events enable row level security;
alter table public.ufc_fights enable row level security;
alter table public.ufc_fight_ratings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ufc_events' and policyname = 'ufc events are readable'
  ) then
    create policy "ufc events are readable" on public.ufc_events for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ufc_fights' and policyname = 'ufc fights are readable'
  ) then
    create policy "ufc fights are readable" on public.ufc_fights for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ufc_fight_ratings' and policyname = 'ufc ratings are readable'
  ) then
    create policy "ufc ratings are readable" on public.ufc_fight_ratings for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ufc_fight_ratings' and policyname = 'users can write own ufc ratings'
  ) then
    create policy "users can write own ufc ratings" on public.ufc_fight_ratings for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ufc_fight_ratings' and policyname = 'users can update own ufc ratings'
  ) then
    create policy "users can update own ufc ratings" on public.ufc_fight_ratings for update
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
