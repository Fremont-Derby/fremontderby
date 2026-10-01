-- Standing availability for captains (recruiting / sub pool). Does not override per-date check-in.

alter table public.players
  add column if not exists standing_availability_status text
    check (
      standing_availability_status is null
      or standing_availability_status in (
        'available_for_subs',
        'limited',
        'unavailable',
        'prefer_not_to_say'
      )
    ),
  add column if not exists standing_availability_note text
    check (
      standing_availability_note is null
      or char_length(standing_availability_note) <= 120
    );

comment on column public.players.standing_availability_status is
  'Optional standing signal for captains; night-of player_date_availability still wins for published rounds.';
comment on column public.players.standing_availability_note is
  'Optional short note (max 120) shown with standing availability.';

create or replace function public.set_own_standing_availability(
  actor_user_id uuid,
  standing_status text,
  standing_note text default null
)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  standing_availability_status text,
  standing_availability_note text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_status text;
  normalized_note text;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if standing_status is null or btrim(standing_status) = '' then
    normalized_status := null;
  else
    normalized_status := lower(btrim(standing_status));
    if normalized_status not in ('available_for_subs', 'limited', 'unavailable', 'prefer_not_to_say') then
      raise exception 'standing_status must be available_for_subs, limited, unavailable, or prefer_not_to_say';
    end if;
  end if;

  if standing_note is null or btrim(standing_note) = '' then
    normalized_note := null;
  else
    normalized_note := btrim(standing_note);
    if char_length(normalized_note) > 120 then
      raise exception 'standing_note must be 120 characters or fewer';
    end if;
  end if;

  update public.players p
  set standing_availability_status = normalized_status,
      standing_availability_note = normalized_note,
      updated_at = now()
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before setting standing availability';
  end if;

  return query
  select p.id, p.user_id, p.display_name, p.standing_availability_status, p.standing_availability_note
  from public.players p
  where p.user_id = actor_user_id
  limit 1;
end;
$$;

revoke all on function public.set_own_standing_availability(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.set_own_standing_availability(uuid, text, text)
  to service_role;

create or replace function public.get_own_player_profile(
  actor_user_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  fargo_rating integer,
  rating_status text,
  standing_availability_status text,
  standing_availability_note text,
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
    p.standing_availability_status,
    p.standing_availability_note,
    coalesce(team_rows.teams, '[]'::jsonb) as teams,
    coalesce(season_rows.seasons, '[]'::jsonb) as seasons
  from public.players p
  left join public.player_ratings pr
    on pr.player_id = p.id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'seasonId', tm.season_id,
        'seasonName', s.name,
        'teamId', tm.team_id,
        'teamName', t.name,
        'role', tm.role,
        'startsAt', tm.starts_at,
        'endsAt', tm.ends_at
      )
      order by s.name, t.name, tm.starts_at
    ) as teams
    from public.team_memberships tm
    join public.teams t
      on t.id = tm.team_id
     and t.season_id = tm.season_id
    join public.seasons s
      on s.id = tm.season_id
    where tm.player_id = p.id
  ) team_rows on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'seasonId', sp.season_id,
        'seasonName', s.name,
        'participationType', sp.participation_type,
        'status', sp.status
      )
      order by s.name, sp.participation_type
    ) as seasons
    from public.season_players sp
    join public.seasons s
      on s.id = sp.season_id
    where sp.player_id = p.id
  ) season_rows on true
  where p.user_id = actor_user_id
  limit 1;
$$;
