-- Cache for Strava athlete activities and stats.
-- Stores JSONB data to avoid hitting Strava rate limits (200 req/15min, 2000/day).
-- Data is refreshed on-demand when synced_at is older than the cache TTL.

create table if not exists public.strava_athlete_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activities jsonb not null default '[]'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strava_athlete_cache_user_id_key unique (user_id)
);

-- Auto-update updated_at (reuses function from 005_monetization)
drop trigger if exists set_strava_athlete_cache_updated_at on public.strava_athlete_cache;
create trigger set_strava_athlete_cache_updated_at
  before update on public.strava_athlete_cache
  for each row execute function public.update_payment_updated_at();

-- RLS: service_role only (accessed via admin client)
alter table public.strava_athlete_cache enable row level security;

comment on table public.strava_athlete_cache is 'Cached Strava activities and stats per user, refreshed on demand';
