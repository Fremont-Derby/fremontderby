create or replace function public.undo_player_match_rack(
  actor_user_id uuid,
  target_player_match_id uuid
)
returns table (
  player_match_id uuid,
  undone_rack_number integer,
  undone_winner_side text,
  score_a integer,
  score_b integer,
  current_discipline text,
  winner_side text,
  winner_player_id uuid,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  undone_rack public.player_match_racks%rowtype;
  updated_match public.player_matches%rowtype;
  remaining_rack_count integer;
  next_score_a integer;
  next_score_b integer;
  next_discipline text;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_player_match_id is null then
    raise exception 'target_player_match_id is required';
  end if;

  select *
    into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;

  if not found then
    raise exception 'Player match not found';
  end if;

  if target_match.status in ('finalized', 'corrected') then
    raise exception 'Player match is finalized';
  end if;

  if not private.can_score_player_match(actor_user_id, target_match) then
    raise exception 'Only match players or active team captains can undo racks';
  end if;

  select *
    into undone_rack
  from public.player_match_racks pmr
  where pmr.player_match_id = target_player_match_id
  order by pmr.rack_number desc
  limit 1
  for update;

  if not found then
    raise exception 'Player match has no racks to undo';
  end if;

  delete from public.player_match_racks pmr
  where pmr.id = undone_rack.id;

  select
    count(*)::integer,
    count(*) filter (where pmr.winner_side = 'A')::integer,
    count(*) filter (where pmr.winner_side = 'B')::integer
  into remaining_rack_count, next_score_a, next_score_b
  from public.player_match_racks pmr
  where pmr.player_match_id = target_player_match_id;

  next_discipline := case
    when remaining_rack_count >= target_match.opening_block_length then
      case
        when target_match.opening_discipline = '8-ball' then '9-ball'
        else '8-ball'
      end
    else target_match.opening_discipline
  end;

  update public.player_matches
  set score_a = next_score_a,
      score_b = next_score_b,
      current_discipline = next_discipline,
      winner_side = null,
      winner_player_id = null,
      status = case when remaining_rack_count = 0 then 'scheduled' else 'in_progress' end
  where player_matches.id = target_player_match_id
  returning *
  into updated_match;

  insert into private.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state
  ) values (
    actor_user_id,
    'player_match.rack_undo',
    'player_match',
    target_player_match_id,
    jsonb_build_object(
      'match', to_jsonb(target_match),
      'removedRack', to_jsonb(undone_rack)
    ),
    to_jsonb(updated_match)
  );

  return query
  select
    updated_match.id,
    undone_rack.rack_number,
    undone_rack.winner_side,
    updated_match.score_a,
    updated_match.score_b,
    updated_match.current_discipline,
    updated_match.winner_side,
    updated_match.winner_player_id,
    updated_match.status;
end;
$$;

revoke all on function public.undo_player_match_rack(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.undo_player_match_rack(uuid, uuid)
  to service_role;

comment on function public.undo_player_match_rack(uuid, uuid) is
  'Service-role-only scoring undo boundary that removes the latest rack before finalization, recalculates match state, and writes an audit event.';
