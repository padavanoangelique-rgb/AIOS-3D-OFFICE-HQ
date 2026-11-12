-- 3D city add-on. New tables only; nothing existing is altered.
create table if not exists public.aios_city_rooms (
  bot_id text primary key,
  place text not null check (place ~ '^[a-z0-9_-]{1,32}$'),
  updated_at timestamptz not null default now()
);
create table if not exists public.aios_city_notes (
  id bigint generated always as identity primary key,
  place text not null check (place ~ '^[a-z0-9_-]{1,32}$'),
  kind text not null check (kind in ('goal','note','idea','material')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists aios_city_notes_place_idx on public.aios_city_notes (place, id);
-- Row level security on, with no policies: only the aios-city function (service role) can read or write.
alter table public.aios_city_rooms enable row level security;
alter table public.aios_city_notes enable row level security;
revoke all on public.aios_city_rooms from anon, authenticated;
revoke all on public.aios_city_notes from anon, authenticated;
