-- #87 stored Fargo report revisions. Not a send.

create table if not exists public.fargo_reports (
  id uuid primary key default gen_random_uuid(),
  player_match_id uuid not null references public.player_matches(id) on delete cascade,
  revision integer not null check (revision > 0),
  idempotency_key text not null unique,
  status text not null check (status in ('not_sent', 'needs_review', 'superseded')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (player_match_id, revision)
);

alter table public.fargo_reports enable row level security;
grant all on public.fargo_reports to service_role;
