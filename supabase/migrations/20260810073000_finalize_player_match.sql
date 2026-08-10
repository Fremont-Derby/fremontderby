alter table public.player_matches
  add column if not exists finalized_at timestamptz,
  add column if not exists finalized_by uuid references auth.users(id) on delete restrict;

create or replace function public.finalize_player_match(
  actor_user_id uuid,
  target_player_match_id uuid
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
    raise exception 'Player match is already finalized';
  end if;

  if not private.can_score_player_match(actor_user_id, target_match) then
    raise exception 'Only match players or active team captains can finalize matches';
  end if;

  if target_match.winner_side is null or target_match.winner_player_id is null then
    raise exception 'Race target must be reached before finalization';
  end if;

  if target_match.race_to_a is null or target_match.race_to_b is null then
    raise exception 'Race targets are required before finalization';
  end if;

  if target_match.winner_side = 'A' and (
    target_match.score_a < target_match.race_to_a
    or target_match.winner_player_id <> target_match.player_a_id
  ) then
    raise exception 'Player match is not in a valid completed race state';
  end if;

  if target_match.winner_side = 'B' and (
    target_match.score_b < target_match.race_to_b
    or target_match.winner_player_id <> target_match.player_b_id
  ) then
    raise exception 'Player match is not in a valid completed race state';
  end if;

  update public.player_matches
  set status = 'finalized',
      finalized_by = actor_user_id,
      finalized_at = now()
  where player_matches.id = target_player_match_id
  returning *
  into finalized_match;

  insert into private.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state
  ) values (
    actor_user_id,
    'player_match.finalize',
    'player_match',
    target_player_match_id,
    to_jsonb(target_match),
    to_jsonb(finalized_match)
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

revoke all on function public.finalize_player_match(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.finalize_player_match(uuid, uuid)
  to service_role;

comment on column public.player_matches.finalized_at is
  'Trusted timestamp when the player match result was finalized.';

comment on column public.player_matches.finalized_by is
  'Authenticated actor who finalized the player match result.';

comment on function public.finalize_player_match(uuid, uuid) is
  'Service-role-only finalization boundary that refuses incomplete race state and writes an audit event.';
