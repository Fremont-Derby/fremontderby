create or replace function public.set_player_match_opening_discipline(
  actor_user_id uuid,
  target_player_match_id uuid,
  target_scoring_team_id uuid,
  opening_discipline text
)
returns table (
  player_match_id uuid,
  selected_opening_discipline text,
  selected_current_discipline text,
  opening_block_length integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  has_team_score_racks boolean;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  if target_scoring_team_id is null then raise exception 'target_scoring_team_id is required'; end if;
  if opening_discipline not in ('8-ball', '9-ball') then
    raise exception 'opening_discipline must be 8-ball or 9-ball';
  end if;

  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;

  if target_match.status in ('finalized', 'corrected') then
    raise exception 'Player match is finalized';
  end if;

  tracker_id := private.match_tracker_for_scoring_team(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );

  select exists (
    select 1
    from private.player_match_score_submissions s
    where s.player_match_id = target_player_match_id
      and jsonb_array_length(coalesce(s.racks, '[]'::jsonb)) > 0
  ) into has_team_score_racks;

  if has_team_score_racks or exists (
    select 1 from public.player_match_racks r
    where r.player_match_id = target_player_match_id
  ) then
    raise exception 'Opening discipline is locked after rack 1 is recorded';
  end if;

  update public.player_matches pm
  set opening_discipline = set_player_match_opening_discipline.opening_discipline,
      current_discipline = set_player_match_opening_discipline.opening_discipline
  where pm.id = target_player_match_id;

  insert into private.audit_events(
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state
  ) values (
    actor_user_id,
    'player_match.set_opening_discipline',
    'player_match',
    target_player_match_id,
    jsonb_build_object(
      'scoringTeamId', target_scoring_team_id,
      'trackerPlayerId', tracker_id,
      'openingDiscipline', target_match.opening_discipline
    ),
    jsonb_build_object(
      'scoringTeamId', target_scoring_team_id,
      'trackerPlayerId', tracker_id,
      'openingDiscipline', opening_discipline
    )
  );

  return query
  select
    target_player_match_id,
    opening_discipline,
    opening_discipline,
    target_match.opening_block_length;
end;
$$;

revoke all on function public.set_player_match_opening_discipline(uuid, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_player_match_opening_discipline(uuid, uuid, uuid, text)
  to service_role;

comment on function public.set_player_match_opening_discipline(uuid, uuid, uuid, text) is
  'Service-role-only team-authorized shared match setup. Sets 8-ball-first or 9-ball-first and locks once rack 1 exists.';
