create or replace function public.publish_season_schedule(
  target_season_id uuid,
  actor_user_id uuid,
  expected_previous_status text,
  rounds_payload jsonb
)
returns table (
  round_count integer,
  team_match_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  inserted_round_id uuid;
  inserted_round_count integer := 0;
  inserted_match_count integer := 0;
  round_item jsonb;
  match_item jsonb;
begin
  if target_season_id is null then
    raise exception 'target_season_id is required';
  end if;

  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if not exists (
    select 1
    from private.league_admins la
    where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  if jsonb_typeof(rounds_payload) is distinct from 'array' then
    raise exception 'rounds_payload must be an array';
  end if;

  select s.status
    into current_status
  from public.seasons s
  where s.id = target_season_id
  for update;

  if not found then
    raise exception 'Season not found';
  end if;

  if current_status is distinct from expected_previous_status then
    raise exception 'Season status changed';
  end if;

  if current_status not in ('draft', 'registration') then
    raise exception 'Season must be draft or registration to publish';
  end if;

  if exists (
    select 1
    from public.rounds r
    where r.season_id = target_season_id
  ) then
    raise exception 'Season schedule already exists';
  end if;

  update public.seasons
  set status = 'active'
  where id = target_season_id;

  for round_item in
    select value from jsonb_array_elements(rounds_payload)
  loop
    if jsonb_typeof(round_item -> 'matches') is distinct from 'array' then
      raise exception 'round matches must be an array';
    end if;

    insert into public.rounds (
      season_id,
      round_number,
      stage,
      scheduled_on
    ) values (
      target_season_id,
      (round_item ->> 'roundNumber')::integer,
      coalesce(round_item ->> 'stage', 'regular'),
      (round_item ->> 'scheduledOn')::date
    )
    returning id into inserted_round_id;

    inserted_round_count := inserted_round_count + 1;

    for match_item in
      select value from jsonb_array_elements(round_item -> 'matches')
    loop
      insert into public.team_matches (
        season_id,
        round_id,
        table_number,
        team_a_id,
        team_b_id
      ) values (
        target_season_id,
        inserted_round_id,
        (match_item ->> 'tableNumber')::integer,
        (match_item ->> 'teamAId')::uuid,
        (match_item ->> 'teamBId')::uuid
      );

      inserted_match_count := inserted_match_count + 1;
    end loop;
  end loop;

  if inserted_round_count <> 7 then
    raise exception 'Season 1 publication requires 7 rounds';
  end if;

  if inserted_match_count <> 28 then
    raise exception 'Season 1 publication requires 28 team matches';
  end if;

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
  'Service-role-only transaction boundary for publishing a validated Season 1 schedule by a league admin.';
