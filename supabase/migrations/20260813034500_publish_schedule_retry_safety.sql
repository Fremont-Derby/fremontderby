create or replace function public.publish_season_schedule(
  target_season_id uuid,
  actor_user_id uuid,
  expected_previous_status text,
  rounds_payload jsonb
)
returns table(round_count integer, team_match_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  required_team_count integer;
  viable_team_count integer;
  existing_round_count integer;
  existing_match_count integer;
  inserted_round_id uuid;
  inserted_round_count integer := 0;
  inserted_match_count integer := 0;
  round_item jsonb;
  match_item jsonb;
begin
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if not exists(select 1 from private.league_admins la where la.user_id = actor_user_id) then
    raise exception 'Actor is not a league admin';
  end if;
  if jsonb_typeof(rounds_payload) is distinct from 'array' then
    raise exception 'rounds_payload must be an array';
  end if;

  perform private.expire_season_team_registration(target_season_id);
  select s.status, s.team_capacity into current_status, required_team_count
  from public.seasons s where s.id = target_season_id for update;
  if not found then raise exception 'Season not found'; end if;

  -- A double-submit or stale second tab can arrive after the first transaction
  -- commits. Treat that as a successful retry only when the persisted schedule
  -- is complete; never manufacture or repair a partial active schedule here.
  if current_status = 'active' then
    select count(*)::integer into existing_round_count
    from public.rounds r
    where r.season_id = target_season_id;

    select count(*)::integer into existing_match_count
    from public.team_matches tm
    where tm.season_id = target_season_id;

    if existing_round_count <> 7 or existing_match_count <> 28 then
      raise exception 'Active season schedule is incomplete';
    end if;

    round_count := existing_round_count;
    team_match_count := existing_match_count;
    return next;
    return;
  end if;

  if current_status is distinct from expected_previous_status then raise exception 'Season status changed'; end if;
  if current_status not in ('draft', 'registration') then
    raise exception 'Season must be draft or registration to publish';
  end if;

  select count(*)::integer into viable_team_count
  from private.season_team_slots sts
  where sts.season_id = target_season_id
    and sts.status = 'confirmed'
    and (
      select count(*) from public.team_memberships tm
      where tm.team_id = sts.team_id and tm.ends_at is null
    ) >= (
      select s.minimum_committed_roster from public.seasons s where s.id = target_season_id
    );

  if viable_team_count <> required_team_count then
    raise exception 'Season requires exactly % confirmed teams meeting the minimum roster before publication', required_team_count;
  end if;
  if exists(select 1 from public.rounds r where r.season_id = target_season_id) then
    raise exception 'Season schedule already exists';
  end if;

  update public.seasons set status = 'active' where id = target_season_id;
  for round_item in select value from jsonb_array_elements(rounds_payload) loop
    if jsonb_typeof(round_item->'matches') is distinct from 'array' then
      raise exception 'round matches must be an array';
    end if;
    insert into public.rounds(season_id, round_number, stage, scheduled_on)
    values(
      target_season_id,
      (round_item->>'roundNumber')::integer,
      coalesce(round_item->>'stage', 'regular'),
      (round_item->>'scheduledOn')::date
    ) returning id into inserted_round_id;
    inserted_round_count := inserted_round_count + 1;
    for match_item in select value from jsonb_array_elements(round_item->'matches') loop
      insert into public.team_matches(season_id, round_id, table_number, team_a_id, team_b_id)
      values(
        target_season_id,
        inserted_round_id,
        (match_item->>'tableNumber')::integer,
        (match_item->>'teamAId')::uuid,
        (match_item->>'teamBId')::uuid
      );
      inserted_match_count := inserted_match_count + 1;
    end loop;
  end loop;
  if inserted_round_count <> 7 then raise exception 'Season 1 publication requires 7 rounds'; end if;
  if inserted_match_count <> 28 then raise exception 'Season 1 publication requires 28 team matches'; end if;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, before_state, after_state)
  values(
    actor_user_id,
    'season.publish_schedule',
    'season',
    target_season_id,
    jsonb_build_object('status', current_status),
    jsonb_build_object('status', 'active', 'roundCount', inserted_round_count, 'teamMatchCount', inserted_match_count)
  );
  round_count := inserted_round_count;
  team_match_count := inserted_match_count;
  return next;
end;
$$;

revoke all on function public.publish_season_schedule(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_season_schedule(uuid, uuid, text, jsonb)
  to service_role;

comment on function public.publish_season_schedule(uuid, uuid, text, jsonb) is
  'Service-role-only audited schedule publication. Row-locked and idempotent for complete active-season retries; incomplete active schedules fail closed.';
