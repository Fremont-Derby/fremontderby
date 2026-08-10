create or replace function public.admin_override_reconciled_player_match(
  actor_user_id uuid,
  target_player_match_id uuid,
  resolution_reason_text text,
  resolved_racks jsonb
)
returns table (
  player_match_id uuid,
  status text,
  winner_side text,
  winner_player_id uuid,
  score_a integer,
  score_b integer,
  finalized_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  finalized_match public.player_matches%rowtype;
  submission_a private.player_match_score_submissions%rowtype;
  submission_b private.player_match_score_submissions%rowtype;
  normalized_reason text;
  resolved_score_a integer;
  resolved_score_b integer;
  resolved_winner_side text;
  resolved_winner_player_id uuid;
  canonical_before jsonb;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_player_match_id is null then
    raise exception 'target_player_match_id is required';
  end if;

  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  normalized_reason := btrim(coalesce(resolution_reason_text, ''));
  if normalized_reason = '' then
    raise exception 'Resolution reason is required';
  end if;

  if resolved_racks is null
      or jsonb_typeof(resolved_racks) is distinct from 'array'
      or jsonb_array_length(resolved_racks) = 0 then
    raise exception 'Resolved rack history is required';
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
    raise exception 'Player match is already finalized';
  end if;

  if target_match.race_to_a is null or target_match.race_to_b is null then
    raise exception 'Race targets are required before finalization';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(resolved_racks) with ordinality as rack(value, ordinality)
    where coalesce(rack.value ->> 'winnerSide', '') not in ('A', 'B')
       or nullif(rack.value ->> 'rackNumber', '')::integer is distinct from rack.ordinality::integer
       or coalesce(rack.value ->> 'discipline', '') is distinct from (
         case
           when rack.ordinality <= target_match.opening_block_length then target_match.opening_discipline
           when target_match.opening_discipline = '8-ball' then '9-ball'
           else '8-ball'
         end
       )
  ) then
    raise exception 'Resolved rack history is invalid';
  end if;

  select
    count(*) filter (where rack.value ->> 'winnerSide' = 'A')::integer,
    count(*) filter (where rack.value ->> 'winnerSide' = 'B')::integer
  into resolved_score_a, resolved_score_b
  from jsonb_array_elements(resolved_racks) as rack(value);

  if resolved_score_a >= target_match.race_to_a
      and resolved_score_b >= target_match.race_to_b then
    raise exception 'Resolved score cannot have both players reach the race target';
  end if;

  if resolved_score_a < target_match.race_to_a
      and resolved_score_b < target_match.race_to_b then
    raise exception 'Race target must be reached before finalization';
  end if;

  if resolved_score_a >= target_match.race_to_a then
    resolved_winner_side := 'A';
    resolved_winner_player_id := target_match.player_a_id;
  else
    resolved_winner_side := 'B';
    resolved_winner_player_id := target_match.player_b_id;
  end if;

  select * into submission_a
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id = target_match.player_a_id;

  select * into submission_b
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id = target_match.player_b_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'rackNumber', pmr.rack_number,
        'discipline', pmr.discipline,
        'winnerSide', pmr.winner_side,
        'winnerPlayerId', pmr.winner_player_id,
        'recordedBy', pmr.recorded_by,
        'recordedAt', pmr.recorded_at
      ) order by pmr.rack_number
    ),
    '[]'::jsonb
  ) into canonical_before
  from public.player_match_racks pmr
  where pmr.player_match_id = target_player_match_id;

  delete from public.player_match_racks pmr
  where pmr.player_match_id = target_player_match_id;

  insert into public.player_match_racks (
    season_id,
    player_match_id,
    rack_number,
    discipline,
    winner_side,
    winner_player_id,
    recorded_by
  )
  select
    target_match.season_id,
    target_player_match_id,
    rack.ordinality::integer,
    rack.value ->> 'discipline',
    rack.value ->> 'winnerSide',
    case when rack.value ->> 'winnerSide' = 'A'
      then target_match.player_a_id else target_match.player_b_id end,
    actor_user_id
  from jsonb_array_elements(resolved_racks) with ordinality as rack(value, ordinality)
  order by rack.ordinality;

  update public.player_matches
  set score_a = resolved_score_a,
      score_b = resolved_score_b,
      winner_side = resolved_winner_side,
      winner_player_id = resolved_winner_player_id,
      status = 'finalized',
      finalized_by = actor_user_id,
      finalized_at = now()
  where player_matches.id = target_player_match_id
  returning * into finalized_match;

  insert into private.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    reason,
    before_state,
    after_state
  ) values (
    actor_user_id,
    'player_match.admin_override_reconciled',
    'player_match',
    target_player_match_id,
    normalized_reason,
    jsonb_build_object(
      'match', to_jsonb(target_match),
      'canonicalRacks', canonical_before,
      'playerASubmission', to_jsonb(submission_a),
      'playerBSubmission', to_jsonb(submission_b)
    ),
    jsonb_build_object(
      'match', to_jsonb(finalized_match),
      'resolvedRacks', resolved_racks
    )
  );

  return query
  select
    finalized_match.id,
    finalized_match.status,
    finalized_match.winner_side,
    finalized_match.winner_player_id,
    finalized_match.score_a,
    finalized_match.score_b,
    finalized_match.finalized_at;
end;
$$;

revoke all on function public.admin_override_reconciled_player_match(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_override_reconciled_player_match(uuid, uuid, text, jsonb)
  to service_role;

comment on function public.admin_override_reconciled_player_match(uuid, uuid, text, jsonb) is
  'Service-role-only league-admin dispute finalizer requiring an audit reason and explicit resolved rack history while preserving both player submissions.';
