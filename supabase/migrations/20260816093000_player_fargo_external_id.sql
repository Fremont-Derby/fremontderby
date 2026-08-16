-- #365 Self-service Fargo external ID on player profile.
-- Lane clones (dru/jfl/gamma) applied live with the same shape; this file is the public baseline.

alter table public.players
  add column if not exists fargo_external_id text;

comment on column public.players.fargo_external_id is
  'Player-supplied FargoRate identifier; not an authoritative rating.';

drop function if exists public.get_own_player_profile(uuid);
drop function if exists public.upsert_player_profile(uuid, text);
drop function if exists public.upsert_player_profile(uuid, text, text);

create or replace function public.get_own_player_profile(actor_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  fargo_rating integer,
  rating_status text,
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
  select p.id, p.user_id, p.display_name, pr.fargo_rating, pr.rating_status,
         p.standing_availability_status, p.standing_availability_note, p.fargo_external_id,
         coalesce(team_rows.teams, '[]'::jsonb),
         coalesce(season_rows.seasons, '[]'::jsonb)
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

create or replace function public.upsert_player_profile(
  actor_user_id uuid,
  profile_display_name text,
  profile_fargo_external_id text default null
)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  fargo_external_id text
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  normalized_display_name text;
  normalized_fargo text;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  normalized_display_name := btrim(profile_display_name);
  if normalized_display_name is null or char_length(normalized_display_name) = 0 then
    raise exception 'display_name is required';
  end if;
  if char_length(normalized_display_name) > 80 then
    raise exception 'display_name must be 80 characters or fewer';
  end if;

  normalized_fargo := nullif(btrim(coalesce(profile_fargo_external_id, '')), '');
  if normalized_fargo is not null and char_length(normalized_fargo) > 40 then
    raise exception 'fargo_external_id must be 40 characters or fewer';
  end if;
  if normalized_fargo is not null and normalized_fargo !~ '^[A-Za-z0-9._\-]+$' then
    raise exception 'fargo_external_id may only contain letters, numbers, dot, underscore, hyphen';
  end if;

  return query
  insert into public.players (user_id, display_name, fargo_external_id)
  values (actor_user_id, normalized_display_name, normalized_fargo)
  on conflict on constraint players_user_id_key do update
    set display_name = excluded.display_name,
        fargo_external_id = coalesce(excluded.fargo_external_id, public.players.fargo_external_id),
        updated_at = now()
  returning players.id, players.user_id, players.display_name, players.fargo_external_id;
end;
$$;

revoke all on function public.get_own_player_profile(uuid) from public, anon, authenticated;
grant execute on function public.get_own_player_profile(uuid) to service_role;
revoke all on function public.upsert_player_profile(uuid, text, text) from public, anon, authenticated;
grant execute on function public.upsert_player_profile(uuid, text, text) to service_role;
