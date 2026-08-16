-- #89 / #84 Phase 1 — canonical external identities + immutable rating observations.
-- Official Fargo stays externally sourced; Derby estimates/admin provisional are labeled separately.

create table if not exists public.player_external_identities (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  provider text not null check (provider in ('fargo', 'fremont_open', 'challonge', 'other')),
  external_id text not null check (char_length(btrim(external_id)) between 1 and 80),
  display_label text,
  verified_at timestamptz,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'self_asserted', 'admin_verified', 'rejected')),
  linked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_id)
);

create index if not exists player_external_identities_player_idx
  on public.player_external_identities (player_id, provider);

comment on table public.player_external_identities is
  'Canonical links from a Derby player to external systems (Fargo, Fremont Open, etc.). One external id maps to at most one Derby player.';

create table if not exists public.rating_observations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  external_identity_id uuid references public.player_external_identities(id) on delete set null,
  source_kind text not null
    check (source_kind in ('official_fargo', 'derby_estimate', 'admin_provisional', 'fremont_open_import', 'other')),
  rating_value integer not null check (rating_value between 0 and 1000),
  robustness numeric,
  games_count integer check (games_count is null or games_count >= 0),
  confidence text check (confidence is null or confidence in ('low', 'medium', 'high')),
  observed_at timestamptz not null default now(),
  effective_at timestamptz not null default now(),
  provenance jsonb not null default '{}'::jsonb,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists rating_observations_player_effective_idx
  on public.rating_observations (player_id, effective_at desc);

comment on table public.rating_observations is
  'Immutable rating observations with provenance. Never overwrite; append new effective rows. Official Fargo must use source_kind=official_fargo.';

-- Enrich player_ratings with source provenance (launch-safe seed display).
alter table public.player_ratings
  add column if not exists rating_source text
    check (rating_source is null or rating_source in ('official_fargo', 'derby_estimate', 'admin_provisional', 'unverified')),
  add column if not exists robustness numeric,
  add column if not exists confidence text
    check (confidence is null or confidence in ('low', 'medium', 'high')),
  add column if not exists last_observation_id uuid references public.rating_observations(id) on delete set null,
  add column if not exists source_note text;

comment on column public.player_ratings.rating_source is
  'How the current seed should be labeled: official_fargo vs derby_estimate vs admin_provisional.';
comment on column public.player_ratings.robustness is
  'Optional Fargo robustness / confidence metadata; informational only.';

alter table public.player_external_identities enable row level security;
alter table public.rating_observations enable row level security;
revoke all on table public.player_external_identities from public, anon, authenticated;
revoke all on table public.rating_observations from public, anon, authenticated;
grant select, insert, update on table public.player_external_identities to service_role;
grant select, insert on table public.rating_observations to service_role;
grant select, update on table public.player_ratings to service_role;

-- Keep legacy players.fargo_external_id in sync with canonical fargo identity when present.
create or replace function private.sync_fargo_external_identity_from_player()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
begin
  normalized := nullif(btrim(coalesce(new.fargo_external_id, '')), '');
  if normalized is null then
    return new;
  end if;
  if normalized !~ '^[A-Za-z0-9._\-]+$' then
    raise exception 'fargo_external_id may only contain letters, numbers, dot, underscore, hyphen';
  end if;

  insert into public.player_external_identities (
    player_id, provider, external_id, verification_status, linked_by, updated_at
  )
  values (
    new.id, 'fargo', normalized, 'self_asserted', new.user_id, now()
  )
  on conflict (provider, external_id) do update
    set player_id = excluded.player_id,
        updated_at = now(),
        verification_status = case
          when public.player_external_identities.verification_status = 'admin_verified'
            then public.player_external_identities.verification_status
          else excluded.verification_status
        end;

  return new;
end;
$$;

drop trigger if exists sync_fargo_external_identity_from_player on public.players;
create trigger sync_fargo_external_identity_from_player
  after insert or update of fargo_external_id on public.players
  for each row
  when (new.fargo_external_id is not null)
  execute function private.sync_fargo_external_identity_from_player();

-- Apply current seed from latest observation (does not rewrite match locks).
create or replace function private.apply_latest_rating_observation(target_player_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  obs public.rating_observations%rowtype;
  status text;
  source text;
begin
  select * into obs
  from public.rating_observations
  where player_id = target_player_id
  order by effective_at desc, created_at desc
  limit 1;

  if not found then
    return;
  end if;

  source := case obs.source_kind
    when 'official_fargo' then 'official_fargo'
    when 'derby_estimate' then 'derby_estimate'
    when 'admin_provisional' then 'admin_provisional'
    else 'unverified'
  end;

  status := case
    when obs.source_kind = 'official_fargo' then 'established'
    when obs.source_kind in ('derby_estimate', 'admin_provisional') then 'provisional'
    else 'unverified'
  end;

  insert into public.player_ratings (
    player_id, fargo_rating, rating_status, rating_source, robustness, confidence,
    last_observation_id, source_note, updated_at
  )
  values (
    target_player_id, obs.rating_value, status, source, obs.robustness, obs.confidence,
    obs.id, coalesce(obs.provenance->>'note', obs.source_kind), now()
  )
  on conflict (player_id) do update
    set fargo_rating = excluded.fargo_rating,
        rating_status = excluded.rating_status,
        rating_source = excluded.rating_source,
        robustness = excluded.robustness,
        confidence = excluded.confidence,
        last_observation_id = excluded.last_observation_id,
        source_note = excluded.source_note,
        updated_at = now();
end;
$$;

revoke all on function private.apply_latest_rating_observation(uuid) from public, anon, authenticated;
grant execute on function private.apply_latest_rating_observation(uuid) to service_role;

-- Service-role: record an observation and refresh current seed.
create or replace function public.record_rating_observation(
  actor_user_id uuid,
  target_player_id uuid,
  observation_source_kind text,
  observation_rating_value integer,
  observation_robustness numeric default null,
  observation_games_count integer default null,
  observation_confidence text default null,
  observation_provenance jsonb default '{}'::jsonb
)
returns public.rating_observations
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted public.rating_observations%rowtype;
  is_admin boolean;
begin
  if actor_user_id is null or target_player_id is null then
    raise exception 'actor_user_id and target_player_id are required';
  end if;

  select exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) into is_admin;

  if not is_admin then
    raise exception 'Actor is not a league admin';
  end if;

  if observation_source_kind not in ('official_fargo', 'derby_estimate', 'admin_provisional', 'fremont_open_import', 'other') then
    raise exception 'Invalid observation source_kind';
  end if;

  insert into public.rating_observations (
    player_id, source_kind, rating_value, robustness, games_count, confidence,
    provenance, recorded_by
  )
  values (
    target_player_id, observation_source_kind, observation_rating_value,
    observation_robustness, observation_games_count, observation_confidence,
    coalesce(observation_provenance, '{}'::jsonb), actor_user_id
  )
  returning * into inserted;

  perform private.apply_latest_rating_observation(target_player_id);

  insert into private.audit_events (actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'rating.record_observation',
    'player',
    target_player_id,
    jsonb_build_object(
      'observationId', inserted.id,
      'sourceKind', inserted.source_kind,
      'ratingValue', inserted.rating_value,
      'robustness', inserted.robustness
    )
  );

  return inserted;
end;
$$;

revoke all on function public.record_rating_observation(uuid, uuid, text, integer, numeric, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_rating_observation(uuid, uuid, text, integer, numeric, integer, text, jsonb)
  to service_role;

-- Backfill: provisional seeds without source label.
update public.player_ratings
set rating_source = coalesce(rating_source, case
  when rating_status = 'established' then 'official_fargo'
  when rating_status = 'provisional' then 'admin_provisional'
  else 'unverified'
end)
where rating_source is null;

-- Profile read model: expose source label + robustness (#365 / #89).
drop function if exists public.get_own_player_profile(uuid);

create or replace function public.get_own_player_profile(actor_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  fargo_rating integer,
  rating_status text,
  rating_source text,
  robustness numeric,
  confidence text,
  source_note text,
  standing_availability_status text,
  standing_availability_note text,
  fargo_external_id text,
  teams jsonb,
  seasons jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.user_id,
    p.display_name,
    pr.fargo_rating,
    pr.rating_status,
    pr.rating_source,
    pr.robustness,
    pr.confidence,
    pr.source_note,
    p.standing_availability_status,
    p.standing_availability_note,
    p.fargo_external_id,
    coalesce(team_rows.teams, '[]'::jsonb) as teams,
    coalesce(season_rows.seasons, '[]'::jsonb) as seasons
  from public.players p
  left join public.player_ratings pr on pr.player_id = p.id
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'seasonId', tm.season_id, 'seasonName', s.name, 'teamId', tm.team_id,
      'teamName', t.name, 'role', tm.role, 'startsAt', tm.starts_at, 'endsAt', tm.ends_at
    ) order by s.name, t.name, tm.starts_at) teams
    from public.team_memberships tm
    join public.teams t on t.id = tm.team_id and t.season_id = tm.season_id
    join public.seasons s on s.id = tm.season_id
    where tm.player_id = p.id
  ) team_rows on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'seasonId', sp.season_id, 'seasonName', s.name,
      'participationType', sp.participation_type, 'status', sp.status
    ) order by s.name, sp.participation_type) seasons
    from public.season_players sp
    join public.seasons s on s.id = sp.season_id
    where sp.player_id = p.id
  ) season_rows on true
  where p.user_id = actor_user_id
  limit 1;
$$;

revoke all on function public.get_own_player_profile(uuid) from public, anon, authenticated;
grant execute on function public.get_own_player_profile(uuid) to service_role;
