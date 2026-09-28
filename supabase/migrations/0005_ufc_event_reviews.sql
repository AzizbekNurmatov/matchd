alter table public.ufc_fight_ratings
  add column if not exists event_id text references public.ufc_events (id) on delete cascade;

create unique index if not exists ufc_fight_ratings_user_event_idx
  on public.ufc_fight_ratings (user_id, event_id)
  where fight_id is null and event_id is not null;
