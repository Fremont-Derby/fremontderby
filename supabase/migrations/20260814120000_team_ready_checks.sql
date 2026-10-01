-- Team ready checks: captain or roster member starts a check-in pulse;
-- teammates respond ready / maybe / not_ready. Service-role RPCs only.

create table if not exists private.team_ready_checks (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  round_id uuid not null,
  team_id uuid not null,
  started_by_player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closes_at timestamptz,
  foreign key (round_id, season_id) references public.rounds(id, season_id) on delete cascade,
  foreign key (team_id, season_id) references public.teams(id, season_id) on delete cascade
);

create index if not exists team_ready_checks_team_round_idx
  on private.team_ready_checks (team_id, round_id, status);

create table if not exists private.team_ready_check_responses (
  ready_check_id uuid not null references private.team_ready_checks(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  response text not null check (response in ('ready', 'maybe', 'not_ready')),
  updated_at timestamptz not null default now(),
  primary key (ready_check_id, player_id)
);

revoke all on table private.team_ready_checks from public, anon, authenticated;
revoke all on table private.team_ready_check_responses from public, anon, authenticated;
grant all on table private.team_ready_checks to service_role;
grant all on table private.team_ready_check_responses to service_role;

create or replace function public.start_team_ready_check(
  actor_user_id uuid,
  target_team_id uuid,
  target_round_id uuid
)
returns table (
  id uuid,
  season_id uuid,
  round_id uuid,
  team_id uuid,
  started_by_player_id uuid,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  membership_ok boolean;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_round_id is null then raise exception 'target_round_id is required'; end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before starting a ready check'; end if;

  select r.season_id into target_season_id from public.rounds r where r.id = target_round_id;
  if not found then raise exception 'Round not found'; end if;

  select exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.ends_at is null
  ) into membership_ok;

  if not membership_ok then
    raise exception 'Active team membership is required to start a ready check';
  end if;

  -- Close any prior open check for this team+round so there is one active pulse.
  update private.team_ready_checks trc
     set status = 'closed', closes_at = now()
   where trc.team_id = target_team_id
     and trc.round_id = target_round_id
     and trc.status = 'open';

  return query
  insert into private.team_ready_checks (
    season_id, round_id, team_id, started_by_player_id, status
  ) values (
    target_season_id, target_round_id, target_team_id, actor_player_id, 'open'
  )
  returning
    team_ready_checks.id,
    team_ready_checks.season_id,
    team_ready_checks.round_id,
    team_ready_checks.team_id,
    team_ready_checks.started_by_player_id,
    team_ready_checks.status,
    team_ready_checks.created_at;
end;
$$;

create or replace function public.respond_team_ready_check(
  actor_user_id uuid,
  target_ready_check_id uuid,
  response_value text
)
returns table (
  ready_check_id uuid,
  player_id uuid,
  response text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  check_row private.team_ready_checks%rowtype;
  membership_ok boolean;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_ready_check_id is null then raise exception 'target_ready_check_id is required'; end if;
  if response_value not in ('ready', 'maybe', 'not_ready') then
    raise exception 'response must be ready, maybe, or not_ready';
  end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before responding to a ready check'; end if;

  select * into check_row from private.team_ready_checks trc where trc.id = target_ready_check_id;
  if not found then raise exception 'Ready check not found'; end if;
  if check_row.status <> 'open' then raise exception 'Ready check is closed'; end if;

  select exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = check_row.team_id
      and tm.season_id = check_row.season_id
      and tm.player_id = actor_player_id
      and tm.ends_at is null
  ) into membership_ok;

  if not membership_ok then
    raise exception 'Active team membership is required to respond to a ready check';
  end if;

  return query
  insert into private.team_ready_check_responses (ready_check_id, player_id, response)
  values (target_ready_check_id, actor_player_id, response_value)
  on conflict (ready_check_id, player_id) do update
    set response = excluded.response,
        updated_at = now()
  returning
    team_ready_check_responses.ready_check_id,
    team_ready_check_responses.player_id,
    team_ready_check_responses.response,
    team_ready_check_responses.updated_at;
end;
$$;

create or replace function public.list_my_pending_ready_checks(
  actor_user_id uuid
)
returns table (
  id uuid,
  season_id uuid,
  round_id uuid,
  team_id uuid,
  team_name text,
  round_number integer,
  scheduled_on date,
  started_by_display_name text,
  created_at timestamptz,
  my_response text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id;
  if not found then
    return;
  end if;

  return query
  select
    trc.id,
    trc.season_id,
    trc.round_id,
    trc.team_id,
    t.name as team_name,
    r.round_number,
    r.scheduled_on,
    starter.display_name as started_by_display_name,
    trc.created_at,
    resp.response as my_response
  from private.team_ready_checks trc
  join public.teams t on t.id = trc.team_id and t.season_id = trc.season_id
  join public.rounds r on r.id = trc.round_id and r.season_id = trc.season_id
  join public.players starter on starter.id = trc.started_by_player_id
  join public.team_memberships tm
    on tm.team_id = trc.team_id
   and tm.season_id = trc.season_id
   and tm.player_id = actor_player_id
   and tm.ends_at is null
  left join private.team_ready_check_responses resp
    on resp.ready_check_id = trc.id
   and resp.player_id = actor_player_id
  where trc.status = 'open'
  order by trc.created_at desc;
end;
$$;

revoke all on function public.start_team_ready_check(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.respond_team_ready_check(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.list_my_pending_ready_checks(uuid) from public, anon, authenticated;
grant execute on function public.start_team_ready_check(uuid, uuid, uuid) to service_role;
grant execute on function public.respond_team_ready_check(uuid, uuid, text) to service_role;
grant execute on function public.list_my_pending_ready_checks(uuid) to service_role;
