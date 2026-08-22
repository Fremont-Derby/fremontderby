-- JFL-only repair and guardrail for truthful, exclusive captaincy.
-- Completed-season memberships remain historical and do not block a current captaincy.

do $repair_team_captains$
declare
  duplicate record;
begin
  for duplicate in
    select ranked.*
    from (
      select
        tm.id as membership_id,
        tm.season_id,
        tm.team_id,
        tm.player_id,
        tm.starts_at,
        row_number() over (
          partition by tm.team_id
          order by
            (sts.assigned_captain_player_id = tm.player_id) desc nulls last,
            tm.starts_at asc,
            tm.id asc
        ) as captain_rank
      from jfl.team_memberships tm
      left join lateral (
        select slot.assigned_captain_player_id
        from jfl_private.season_team_slots slot
        where slot.team_id = tm.team_id
        order by
          (slot.status in ('confirmed', 'ready', 'approved_pending_roster')) desc,
          slot.updated_at desc,
          slot.id
        limit 1
      ) sts on true
      where tm.role = 'captain'
        and tm.ends_at is null
    ) ranked
    where ranked.captain_rank > 1
    order by ranked.team_id, ranked.captain_rank
  loop
    insert into jfl_private.audit_events(
      actor_user_id,
      action,
      entity_type,
      entity_id,
      reason,
      before_state,
      after_state
    ) values (
      null,
      'team.captain_invariant_repair',
      'team_membership',
      duplicate.membership_id,
      'Removed an extra current captain from a team while preserving membership.',
      jsonb_build_object(
        'seasonId', duplicate.season_id,
        'teamId', duplicate.team_id,
        'playerId', duplicate.player_id,
        'role', 'captain',
        'endsAt', null
      ),
      jsonb_build_object(
        'seasonId', duplicate.season_id,
        'teamId', duplicate.team_id,
        'playerId', duplicate.player_id,
        'role', 'player',
        'endsAt', null,
        'reason', 'duplicate_current_captain_for_team'
      )
    );

    update jfl.team_memberships
    set role = 'player'
    where id = duplicate.membership_id;
  end loop;
end
$repair_team_captains$;

do $repair_concurrent_captaincies$
declare
  duplicate record;
begin
  for duplicate in
    select ranked.*
    from (
      select
        tm.id as membership_id,
        tm.season_id,
        tm.team_id,
        tm.player_id,
        tm.starts_at,
        row_number() over (
          partition by tm.player_id
          order by
            case s.status
              when 'active' then 1
              when 'playoffs' then 2
              when 'registration' then 3
              else 4
            end,
            tm.starts_at asc,
            tm.id asc
        ) as captain_rank
      from jfl.team_memberships tm
      join jfl.seasons s on s.id = tm.season_id
      where tm.role = 'captain'
        and tm.ends_at is null
        and s.status in ('registration', 'active', 'playoffs')
    ) ranked
    where ranked.captain_rank > 1
    order by ranked.player_id, ranked.captain_rank
  loop
    insert into jfl_private.audit_events(
      actor_user_id,
      action,
      entity_type,
      entity_id,
      reason,
      before_state,
      after_state
    ) values (
      null,
      'team.captain_invariant_repair',
      'team_membership',
      duplicate.membership_id,
      'Removed a concurrent open or live captaincy while preserving membership.',
      jsonb_build_object(
        'seasonId', duplicate.season_id,
        'teamId', duplicate.team_id,
        'playerId', duplicate.player_id,
        'role', 'captain',
        'endsAt', null
      ),
      jsonb_build_object(
        'seasonId', duplicate.season_id,
        'teamId', duplicate.team_id,
        'playerId', duplicate.player_id,
        'role', 'player',
        'endsAt', null,
        'reason', 'concurrent_open_or_live_captaincy'
      )
    );

    update jfl.team_memberships
    set role = 'player'
    where id = duplicate.membership_id;

    update jfl_private.season_team_slots
    set assigned_captain_player_id = null,
        updated_at = now(),
        last_action_reason = 'Captaincy cleared by exclusive-captain invariant repair'
    where season_id = duplicate.season_id
      and team_id = duplicate.team_id
      and assigned_captain_player_id = duplicate.player_id;
  end loop;
end
$repair_concurrent_captaincies$;

create unique index if not exists one_current_captain_per_team
  on jfl.team_memberships (team_id)
  where role = 'captain' and ends_at is null;

create or replace function jfl_private.enforce_concurrent_captaincy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_season_status text;
begin
  if new.role <> 'captain' or new.ends_at is not null then
    return new;
  end if;

  -- Team serialization gives same-team conflicts a stable, human-readable error.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('jfl:captain-team:' || new.team_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('jfl:captain-player:' || new.player_id::text, 0)
  );

  if exists (
    select 1
    from jfl.team_memberships tm
    where tm.team_id = new.team_id
      and tm.role = 'captain'
      and tm.ends_at is null
      and tm.id is distinct from new.id
  ) then
    raise exception 'Team already has a current captain';
  end if;

  select s.status
  into target_season_status
  from jfl.seasons s
  where s.id = new.season_id;

  if target_season_status in ('registration', 'active', 'playoffs') and exists (
    select 1
    from jfl.team_memberships tm
    join jfl.seasons s on s.id = tm.season_id
    where tm.player_id = new.player_id
      and tm.role = 'captain'
      and tm.ends_at is null
      and s.status in ('registration', 'active', 'playoffs')
      and tm.id is distinct from new.id
  ) then
    raise exception 'Player already captains another open or live team';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_concurrent_captaincy on jfl.team_memberships;
create trigger enforce_concurrent_captaincy
before insert or update of season_id, team_id, player_id, role, ends_at
on jfl.team_memberships
for each row execute function jfl_private.enforce_concurrent_captaincy();

revoke all on function jfl_private.enforce_concurrent_captaincy()
  from public, anon, authenticated;

create or replace function jfl_private.guard_concurrent_captaincy_season_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  captain record;
begin
  if new.status in ('registration', 'active', 'playoffs')
     and old.status not in ('registration', 'active', 'playoffs') then
    for captain in
      select tm.id, tm.player_id
      from jfl.team_memberships tm
      where tm.season_id = new.id
        and tm.role = 'captain'
        and tm.ends_at is null
      order by tm.player_id
    loop
      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended('jfl:captain-player:' || captain.player_id::text, 0)
      );

      if exists (
        select 1
        from jfl.team_memberships other_tm
        join jfl.seasons other_season on other_season.id = other_tm.season_id
        where other_tm.player_id = captain.player_id
          and other_tm.role = 'captain'
          and other_tm.ends_at is null
          and other_tm.id <> captain.id
          and other_season.status in ('registration', 'active', 'playoffs')
      ) then
        raise exception 'Season cannot open while a captain leads another open or live team';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_concurrent_captaincy_season_status on jfl.seasons;
create trigger guard_concurrent_captaincy_season_status
before update of status on jfl.seasons
for each row execute function jfl_private.guard_concurrent_captaincy_season_status();

revoke all on function jfl_private.guard_concurrent_captaincy_season_status()
  from public, anon, authenticated;

create or replace function jfl.list_admin_team_captain_candidates(
  actor_user_id uuid,
  target_season_id uuid,
  target_team_id uuid
)
returns table(
  player_id uuid,
  display_name text,
  has_login boolean,
  has_phone boolean,
  rostered_on_team boolean,
  captain_team_id uuid,
  captain_team_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from jfl_private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if not exists (
    select 1 from jfl.teams t
    where t.id = target_team_id and t.season_id = target_season_id
  ) then
    raise exception 'Team not found';
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.user_id is not null,
    nullif(btrim(pc.phone), '') is not null,
    exists (
      select 1 from jfl.team_memberships target_tm
      where target_tm.season_id = target_season_id
        and target_tm.team_id = target_team_id
        and target_tm.player_id = p.id
        and target_tm.ends_at is null
    ),
    captain_tm.team_id,
    captain_team.name
  from jfl.players p
  left join jfl_private.player_contacts pc on pc.player_id = p.id
  left join lateral (
    select tm.team_id
    from jfl.team_memberships tm
    join jfl.seasons captain_season on captain_season.id = tm.season_id
    where tm.player_id = p.id
      and tm.role = 'captain'
      and tm.ends_at is null
      and captain_season.status in ('registration', 'active', 'playoffs')
    order by
      case captain_season.status
        when 'active' then 1
        when 'playoffs' then 2
        else 3
      end,
      tm.starts_at,
      tm.id
    limit 1
  ) captain_tm on true
  left join jfl.teams captain_team on captain_team.id = captain_tm.team_id
  order by
    exists (
      select 1 from jfl.team_memberships target_tm
      where target_tm.season_id = target_season_id
        and target_tm.team_id = target_team_id
        and target_tm.player_id = p.id
        and target_tm.ends_at is null
    ) desc,
    lower(p.display_name),
    p.id;
end;
$$;

revoke all on function jfl.list_admin_team_captain_candidates(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function jfl.list_admin_team_captain_candidates(uuid, uuid, uuid)
  to service_role;

comment on function jfl_private.enforce_concurrent_captaincy() is
  'JFL write guard: one current captain per team and one captaincy per player across registration, active, and playoff seasons.';
comment on function jfl_private.guard_concurrent_captaincy_season_status() is
  'JFL lifecycle guard: a draft season cannot open while one of its captains leads another open or live team.';
comment on function jfl.list_admin_team_captain_candidates(uuid, uuid, uuid) is
  'Service-role-only JFL captain picker exposing any open or live captaincy so unavailable candidates can be disabled.';
