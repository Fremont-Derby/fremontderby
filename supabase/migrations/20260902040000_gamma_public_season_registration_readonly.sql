-- Tracks #1820.
-- Restore a STABLE SQL public-season read model on Gamma when that schema
-- exists. No-op on production (no gamma schema). Does not touch JFL or DRU.

do $install_gamma$
begin
  if to_regnamespace('gamma') is null then
    return;
  end if;
  execute $sql$
create or replace function gamma.list_all_season_registration_internal()
returns table(
  id uuid,
  name text,
  status text,
  first_round_date date,
  team_capacity integer,
  minimum_committed_roster integer,
  team_count integer,
  confirmed_team_count integer,
  occupied_slots integer,
  open_team_slots integer,
  reserved_returning_slots integer,
  held_team_slots integer,
  applications_waiting integer,
  rostered_player_count integer,
  registered_player_count integer,
  free_agent_count integer,
  open_primary_roster_spots integer,
  at_risk_team_count integer
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    s.id,
    s.name,
    s.status,
    s.first_round_date,
    s.team_capacity,
    s.minimum_committed_roster,
    count(distinct sts.team_id) filter (
      where sts.team_id is not null
        and sts.status in ('approved_pending_roster', 'ready', 'confirmed')
    )::integer,
    count(distinct sts.team_id) filter (
      where sts.team_id is not null and sts.status = 'confirmed'
    )::integer,
    count(distinct sts.id) filter (
      where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
    )::integer,
    greatest(0, s.team_capacity - count(distinct sts.id) filter (
      where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
    ))::integer,
    count(distinct sts.id) filter (where sts.status in ('reserved', 'transferred'))::integer,
    count(distinct sts.id) filter (where sts.status in ('approved_pending_roster', 'ready'))::integer,
    count(distinct ta.id) filter (where ta.status in ('applied', 'deferred'))::integer,
    count(distinct tm.player_id) filter (where tm.ends_at is null)::integer,
    count(distinct sp.player_id) filter (where sp.status = 'active')::integer,
    count(distinct sp.player_id) filter (
      where sp.status = 'active'
        and sp.participation_type = 'free_agent'
        and not exists (
          select 1 from gamma.team_memberships active_tm
          where active_tm.season_id = s.id
            and active_tm.player_id = sp.player_id
            and active_tm.ends_at is null
        )
    )::integer,
    (
      select coalesce(sum(greatest(0, 4 - (
        select count(*)
        from gamma.team_memberships spot_tm
        where spot_tm.team_id = spot_slot.team_id
          and spot_tm.ends_at is null
      ))), 0)::integer
      from gamma_private.season_team_slots spot_slot
      where spot_slot.season_id = s.id
        and spot_slot.team_id is not null
        and spot_slot.status in ('approved_pending_roster', 'ready', 'confirmed')
    ),
    count(distinct sts.team_id) filter (
      where sts.team_id is not null
        and sts.status in ('approved_pending_roster', 'ready')
        and (
          select count(*)
          from gamma.team_memberships risk_tm
          where risk_tm.team_id = sts.team_id
            and risk_tm.ends_at is null
        ) < s.minimum_committed_roster
    )::integer
  from gamma.seasons s
  left join gamma_private.season_team_slots sts on sts.season_id = s.id
  left join gamma_private.team_applications ta on ta.season_id = s.id
  left join gamma.team_memberships tm
    on tm.season_id = s.id and tm.ends_at is null
  left join gamma.season_players sp
    on sp.season_id = s.id
  group by s.id;
$fn$;
revoke all on function gamma.list_all_season_registration_internal() from public, anon, authenticated;
grant execute on function gamma.list_all_season_registration_internal() to service_role;
create or replace function gamma.list_public_season_registration()
returns table(
  id uuid,
  name text,
  status text,
  first_round_date date,
  team_capacity integer,
  minimum_committed_roster integer,
  team_count integer,
  confirmed_team_count integer,
  occupied_slots integer,
  open_team_slots integer,
  reserved_returning_slots integer,
  held_team_slots integer,
  applications_waiting integer,
  rostered_player_count integer,
  registered_player_count integer,
  free_agent_count integer,
  open_primary_roster_spots integer,
  at_risk_team_count integer
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select registration.*
  from gamma.list_all_season_registration_internal() registration
  join gamma.seasons season on season.id = registration.id
  where season.purpose = 'league';
$fn$;
revoke all on function gamma.list_public_season_registration() from public, anon, authenticated;
grant execute on function gamma.list_public_season_registration() to service_role;
  $sql$;
end;
$install_gamma$;
