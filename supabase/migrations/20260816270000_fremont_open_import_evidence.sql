-- #85 Fremont Open tournament history as external rating evidence (never Derby standings).

create table if not exists public.external_tournament_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'fremont_open'
    check (source in ('fremont_open', 'challonge', 'other')),
  external_event_id text not null,
  name text not null,
  played_on date,
  game_type text,
  provenance jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  unique (source, external_event_id)
);

create table if not exists public.external_tournament_matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.external_tournament_events(id) on delete cascade,
  source text not null default 'fremont_open',
  external_match_id text not null,
  round_label text,
  game_type text,
  raw_score text,
  winner_external_id text,
  loser_external_id text,
  winner_name text,
  loser_name text,
  racks_won_winner integer,
  racks_won_loser integer,
  score_parse_confidence text
    check (score_parse_confidence is null or score_parse_confidence in ('high', 'medium', 'low', 'match_wl_only')),
  played_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  unique (source, external_match_id)
);

create index if not exists external_tournament_matches_event_idx
  on public.external_tournament_matches (event_id);

create table if not exists public.external_import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed')),
  events_upserted integer not null default 0,
  matches_upserted integer not null default 0,
  unresolved_names integer not null default 0,
  error_summary text,
  provenance jsonb not null default '{}'::jsonb
);

comment on table public.external_tournament_matches is
  'Imported Fremont Open (etc.) matches as rating evidence only. Never affect Derby standings, eligibility, or prizes.';

alter table public.external_tournament_events enable row level security;
alter table public.external_tournament_matches enable row level security;
alter table public.external_import_runs enable row level security;
revoke all on table public.external_tournament_events from public, anon, authenticated;
revoke all on table public.external_tournament_matches from public, anon, authenticated;
revoke all on table public.external_import_runs from public, anon, authenticated;
grant all on table public.external_tournament_events to service_role;
grant all on table public.external_tournament_matches to service_role;
grant all on table public.external_import_runs to service_role;

-- Idempotent single-match upsert for Fremont Open evidence.
create or replace function public.import_fremont_open_match(
  actor_user_id uuid,
  p_external_event_id text,
  p_event_name text,
  p_external_match_id text,
  p_played_on date default null,
  p_game_type text default null,
  p_round_label text default null,
  p_raw_score text default null,
  p_winner_external_id text default null,
  p_loser_external_id text default null,
  p_winner_name text default null,
  p_loser_name text default null,
  p_racks_won_winner integer default null,
  p_racks_won_loser integer default null,
  p_score_parse_confidence text default 'match_wl_only',
  p_provenance jsonb default '{}'::jsonb
)
returns public.external_tournament_matches
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row public.external_tournament_events%rowtype;
  match_row public.external_tournament_matches%rowtype;
  is_admin boolean;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;
  select exists (select 1 from private.league_admins la where la.user_id = actor_user_id)
    into is_admin;
  if not is_admin then
    raise exception 'Actor is not a league admin';
  end if;
  if nullif(btrim(p_external_event_id), '') is null or nullif(btrim(p_external_match_id), '') is null then
    raise exception 'external event and match ids are required';
  end if;

  insert into public.external_tournament_events as e (
    source, external_event_id, name, played_on, game_type, provenance
  ) values (
    'fremont_open', btrim(p_external_event_id), coalesce(nullif(btrim(p_event_name), ''), p_external_event_id),
    p_played_on, p_game_type, coalesce(p_provenance, '{}'::jsonb)
  )
  on conflict (source, external_event_id) do update
    set name = excluded.name,
        played_on = coalesce(excluded.played_on, e.played_on),
        game_type = coalesce(excluded.game_type, e.game_type),
        provenance = e.provenance || excluded.provenance,
        imported_at = now()
  returning * into event_row;

  insert into public.external_tournament_matches as m (
    event_id, source, external_match_id, round_label, game_type, raw_score,
    winner_external_id, loser_external_id, winner_name, loser_name,
    racks_won_winner, racks_won_loser, score_parse_confidence, played_at, provenance
  ) values (
    event_row.id, 'fremont_open', btrim(p_external_match_id), p_round_label, p_game_type, p_raw_score,
    nullif(btrim(coalesce(p_winner_external_id, '')), ''),
    nullif(btrim(coalesce(p_loser_external_id, '')), ''),
    nullif(btrim(coalesce(p_winner_name, '')), ''),
    nullif(btrim(coalesce(p_loser_name, '')), ''),
    p_racks_won_winner, p_racks_won_loser,
    coalesce(p_score_parse_confidence, 'match_wl_only'),
    case when p_played_on is not null then p_played_on::timestamptz else null end,
    coalesce(p_provenance, '{}'::jsonb)
  )
  on conflict (source, external_match_id) do update
    set event_id = excluded.event_id,
        round_label = excluded.round_label,
        game_type = coalesce(excluded.game_type, m.game_type),
        raw_score = excluded.raw_score,
        winner_external_id = excluded.winner_external_id,
        loser_external_id = excluded.loser_external_id,
        winner_name = excluded.winner_name,
        loser_name = excluded.loser_name,
        racks_won_winner = excluded.racks_won_winner,
        racks_won_loser = excluded.racks_won_loser,
        score_parse_confidence = excluded.score_parse_confidence,
        played_at = coalesce(excluded.played_at, m.played_at),
        provenance = m.provenance || excluded.provenance,
        imported_at = now()
  returning * into match_row;

  -- Link external ids to identity table when provided (no silent name merge).
  if match_row.winner_external_id is not null then
    insert into public.player_external_identities (player_id, provider, external_id, display_label, verification_status)
    select p.id, 'fremont_open', match_row.winner_external_id, match_row.winner_name, 'unverified'
    from public.players p
    where false; -- identity link requires existing mapping; names stay unmatched until #92 review
  end if;

  return match_row;
end;
$$;

revoke all on function public.import_fremont_open_match(
  uuid, text, text, text, date, text, text, text, text, text, text, text, integer, integer, text, jsonb
) from public, anon, authenticated;
grant execute on function public.import_fremont_open_match(
  uuid, text, text, text, date, text, text, text, text, text, text, text, integer, integer, text, jsonb
) to service_role;

-- Parse common "7-3" style score strings into racks when safe.
create or replace function public.parse_open_score_string(raw text)
returns table (winner_racks integer, loser_racks integer, confidence text)
language plpgsql
immutable
as $$
declare
  cleaned text;
  m text[];
begin
  cleaned := btrim(coalesce(raw, ''));
  if cleaned = '' then
    winner_racks := null; loser_racks := null; confidence := 'match_wl_only';
    return next; return;
  end if;
  m := regexp_match(cleaned, '^(\d+)\s*[-:]\s*(\d+)$');
  if m is not null then
    winner_racks := greatest(m[1]::int, m[2]::int);
    loser_racks := least(m[1]::int, m[2]::int);
    confidence := 'high';
    return next; return;
  end if;
  winner_racks := null; loser_racks := null; confidence := 'match_wl_only';
  return next;
end;
$$;

revoke all on function public.parse_open_score_string(text) from public, anon, authenticated;
grant execute on function public.parse_open_score_string(text) to service_role;
