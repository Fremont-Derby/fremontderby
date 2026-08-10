alter table public.player_matches
  add column if not exists corrected_at timestamptz,
  add column if not exists corrected_by uuid references auth.users(id) on delete restrict,
  add column if not exists correction_reason text;

create or replace function public.correct_player_match(
  actor_user_id uuid,
  target_player_match_id uuid,
  corrected_winner_side text,
  corrected_score_a integer,
  corrected_score_b integer,
  correction_reason_text text,
  corrected_racks jsonb
)
returns table (
  player_match_id uuid,
  status text,
  winner_side text,
  winner_player_id uuid,
  score_a integer,
  score_b integer,
  corrected_at timestamptz,
  corrected_by uuid,
  correction_reason text,
  racks jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  corrected_match public.player_matches%rowtype;
  normalized_reason text;
  rack_count_a integer;
  rack_count_b integer;
  before_racks jsonb;
  after_racks jsonb;
  corrected_current_discipline text;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_player_match_id is null then
    raise exception 'target_player_match_id is required';
  end if;

  if not exists (
    select 1
    from private.league_admins la
    where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  normalized_reason := btrim(coalesce(correction_reason_text, ''));
  if normalized_reason = '' then
    raise exception 'Correction reason is required';
  end if;

  if corrected_winner_side not in ('A', 'B') then
    raise exception 'corrected_winner_side must be A or B';
  end if;

  if corrected_score_a is null or corrected_score_a < 0
     or corrected_score_b is null or corrected_score_b < 0 then
    raise exception 'Corrected scores must be non-negative';
  end if;

  if corrected_racks is null or jsonb_typeof(corrected_racks) is distinct from 'array' then
    raise exception 'corrected_racks must be an array';
  end if;

  if jsonb_array_length(corrected_racks) = 0 then
    raise exception 'corrected_racks must not be empty';
  end if;

  if jsonb_array_length(corrected_racks) <> corrected_score_a + corrected_score_b then
    raise exception 'Corrected rack history must match corrected score';
  end if;

  if exists (
    select 1
    from (
      select coalesce(rack_item.value ->> 'winnerSide', rack_item.value ->> 'winner_side') as winner_side
      from jsonb_array_elements(corrected_racks) as rack_item(value)
    ) parsed_racks
    where parsed_racks.winner_side is null
       or parsed_racks.winner_side not in ('A', 'B')
  ) then
    raise exception 'Corrected rack winnerSide must be A or B';
  end if;

  select
    (count(*) filter (where parsed_racks.winner_side = 'A'))::integer,
    (count(*) filter (where parsed_racks.winner_side = 'B'))::integer
    into rack_count_a, rack_count_b
  from (
    select coalesce(rack_item.value ->> 'winnerSide', rack_item.value ->> 'winner_side') as winner_side
    from jsonb_array_elements(corrected_racks) as rack_item(value)
  ) parsed_racks;

  if rack_count_a <> corrected_score_a or rack_count_b <> corrected_score_b then
    raise exception 'Corrected rack history must match corrected score';
  end if;

  select *
    into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;

  if not found then
    raise exception 'Player match not found';
  end if;

  if target_match.status not in ('finalized', 'corrected') then
    raise exception 'Player match must be finalized before correction';
  end if;

  if target_match.race_to_a is null or target_match.race_to_b is null then
    raise exception 'Race targets are required before correction';
  end if;

  if corrected_winner_side = 'A' and (
    corrected_score_a < target_match.race_to_a
    or corrected_score_b >= target_match.race_to_b
  ) then
    raise exception 'Player match is not in a valid corrected race state';
  end if;

  if corrected_winner_side = 'B' and (
    corrected_score_b < target_match.race_to_b
    or corrected_score_a >= target_match.race_to_a
  ) then
    raise exception 'Player match is not in a valid corrected race state';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'rackNumber', pmr.rack_number,
        'discipline', pmr.discipline,
        'winnerSide', pmr.winner_side,
        'winnerPlayerId', pmr.winner_player_id,
        'recordedBy', pmr.recorded_by,
        'recordedAt', pmr.recorded_at
      )
      order by pmr.rack_number
    ),
    '[]'::jsonb
  )
    into before_racks
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
    parsed_racks.rack_number,
    case
      when parsed_racks.rack_number <= target_match.opening_block_length then target_match.opening_discipline
      when target_match.opening_discipline = '8-ball' then '9-ball'
      else '8-ball'
    end as discipline,
    parsed_racks.winner_side,
    case
      when parsed_racks.winner_side = 'A' then target_match.player_a_id
      else target_match.player_b_id
    end as winner_player_id,
    actor_user_id
  from (
    select
      rack_item.ordinality::integer as rack_number,
      coalesce(rack_item.value ->> 'winnerSide', rack_item.value ->> 'winner_side') as winner_side
    from jsonb_array_elements(corrected_racks) with ordinality as rack_item(value, ordinality)
  ) parsed_racks
  order by parsed_racks.rack_number;

  corrected_current_discipline := case
    when jsonb_array_length(corrected_racks) <= target_match.opening_block_length then target_match.opening_discipline
    when target_match.opening_discipline = '8-ball' then '9-ball'
    else '8-ball'
  end;

  update public.player_matches
  set score_a = corrected_score_a,
      score_b = corrected_score_b,
      current_discipline = corrected_current_discipline,
      winner_side = corrected_winner_side,
      winner_player_id = case
        when corrected_winner_side = 'A' then target_match.player_a_id
        else target_match.player_b_id
      end,
      status = 'corrected',
      corrected_by = actor_user_id,
      corrected_at = now(),
      correction_reason = normalized_reason
  where player_matches.id = target_player_match_id
  returning *
  into corrected_match;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'rackNumber', pmr.rack_number,
        'discipline', pmr.discipline,
        'winnerSide', pmr.winner_side,
        'winnerPlayerId', pmr.winner_player_id,
        'recordedBy', pmr.recorded_by,
        'recordedAt', pmr.recorded_at
      )
      order by pmr.rack_number
    ),
    '[]'::jsonb
  )
    into after_racks
  from public.player_match_racks pmr
  where pmr.player_match_id = target_player_match_id;

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
    'player_match.correct',
    'player_match',
    target_player_match_id,
    normalized_reason,
    jsonb_build_object(
      'match', to_jsonb(target_match),
      'racks', before_racks
    ),
    jsonb_build_object(
      'match', to_jsonb(corrected_match),
      'racks', after_racks
    )
  );

  return query
  select
    corrected_match.id,
    corrected_match.status,
    corrected_match.winner_side,
    corrected_match.winner_player_id,
    corrected_match.score_a,
    corrected_match.score_b,
    corrected_match.corrected_at,
    corrected_match.corrected_by,
    corrected_match.correction_reason,
    after_racks;
end;
$$;

revoke all on function public.correct_player_match(uuid, uuid, text, integer, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.correct_player_match(uuid, uuid, text, integer, integer, text, jsonb)
  to service_role;

comment on column public.player_matches.corrected_at is
  'Trusted timestamp when a league admin corrected the finalized player match result.';

comment on column public.player_matches.corrected_by is
  'Authenticated league-admin actor who corrected the finalized player match result.';

comment on column public.player_matches.correction_reason is
  'League-admin supplied explanation for the latest finalized-result correction.';

comment on function public.correct_player_match(uuid, uuid, text, integer, integer, text, jsonb) is
  'Service-role-only admin correction boundary that replaces corrected rack history, preserves prior state in audit, and refuses invalid race state.';
