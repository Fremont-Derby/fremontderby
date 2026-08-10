create or replace function public.list_visible_team_lineups(
  actor_user_id uuid,
  target_team_id uuid,
  target_round_id uuid
)
returns table (
  lineup_id uuid,
  season_id uuid,
  round_id uuid,
  team_match_id uuid,
  team_id uuid,
  is_own_team boolean,
  opponent_lineup_visible boolean,
  slot_number integer,
  player_id uuid,
  participation_type text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_round public.rounds%rowtype;
  target_match public.team_matches%rowtype;
  opponent_visible boolean;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_team_id is null then
    raise exception 'target_team_id is required';
  end if;

  if target_round_id is null then
    raise exception 'target_round_id is required';
  end if;

  select *
    into target_round
  from public.rounds r
  where r.id = target_round_id;

  if not found then
    raise exception 'Round not found';
  end if;

  select *
    into target_match
  from public.team_matches tm
  where tm.round_id = target_round_id
    and (tm.team_a_id = target_team_id or tm.team_b_id = target_team_id);

  if not found then
    raise exception 'Team is not scheduled for target round';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before viewing lineups';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can view team lineups';
  end if;

  opponent_visible := (
    exists (
      select 1
      from private.team_lineups home_lineup
      where home_lineup.team_match_id = target_match.id
        and home_lineup.team_id = target_match.team_a_id
    )
    and exists (
      select 1
      from private.team_lineups away_lineup
      where away_lineup.team_match_id = target_match.id
        and away_lineup.team_id = target_match.team_b_id
    )
  ) or (
    target_round.lineup_deadline_at is not null
    and now() > target_round.lineup_deadline_at
  );

  return query
  select
    tl.id as lineup_id,
    tl.season_id,
    tl.round_id,
    tl.team_match_id,
    tl.team_id,
    tl.team_id = target_team_id as is_own_team,
    opponent_visible as opponent_lineup_visible,
    tls.slot_number,
    tls.player_id,
    tls.participation_type,
    tl.submitted_at
  from private.team_lineups tl
  join private.team_lineup_slots tls
    on tls.lineup_id = tl.id
  where tl.team_match_id = target_match.id
    and (
      tl.team_id = target_team_id
      or opponent_visible
    )
  order by
    case when tl.team_id = target_team_id then 0 else 1 end,
    tls.slot_number;
end;
$$;

revoke all on function public.list_visible_team_lineups(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.list_visible_team_lineups(uuid, uuid, uuid)
  to service_role;

comment on function public.list_visible_team_lineups(uuid, uuid, uuid) is
  'Service-role-only captain read model that hides opponent lineup slots until both lineups are submitted or the deadline passes.';
