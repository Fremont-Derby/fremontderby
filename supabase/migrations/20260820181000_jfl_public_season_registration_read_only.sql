create or replace function jfl.list_all_season_registration_internal()
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
as $$
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
        and not exists (
          select 1
          from jfl.team_memberships active_tm
          where active_tm.season_id = s.id
            and active_tm.player_id = sp.player_id
            and active_tm.ends_at is null
        )
    )::integer,
    (
      select coalesce(sum(greatest(0, 4 - (
        select count(*)
        from jfl.team_memberships spot_tm
        where spot_tm.team_id = spot_slot.team_id
          and spot_tm.ends_at is null
      ))), 0)::integer
      from jfl_private.season_team_slots spot_slot
      where spot_slot.season_id = s.id
        and spot_slot.team_id is not null
        and spot_slot.status in ('approved_pending_roster', 'ready', 'confirmed')
    ),
    count(distinct sts.team_id) filter (
      where sts.status = 'confirmed'
        and jfl_private.committed_team_roster_count(sts.team_id, sts.season_id)
            < s.minimum_committed_roster
    )::integer
  from jfl.seasons s
  left join jfl_private.season_team_slots sts on sts.season_id = s.id
  left join jfl_private.team_applications ta on ta.season_id = s.id
  left join jfl.team_memberships tm on tm.season_id = s.id
  left join jfl.season_players sp on sp.season_id = s.id
  group by s.id
  order by s.created_at desc;
$$;
