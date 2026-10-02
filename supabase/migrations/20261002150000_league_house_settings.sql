-- Owner-configurable house settings for the Fargo feed. Not a Fargo acceptance switch.

create table if not exists public.league_house_settings (
  id integer primary key default 1 check (id = 1),
  venue text,
  table_size text,
  table_count integer check (table_count is null or table_count between 1 and 32),
  league_night text check (league_night is null or league_night in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  updated_at timestamptz not null default now()
);

insert into public.league_house_settings (id) values (1) on conflict (id) do nothing;

alter table public.league_house_settings enable row level security;
grant all on public.league_house_settings to service_role;
