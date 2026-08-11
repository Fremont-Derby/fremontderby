create or replace function private.auto_register_rostered_member_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.ends_at is null and exists (
    select 1 from public.seasons s
    where s.id = new.season_id and s.status = 'registration'
  ) then
    insert into public.season_players(season_id, player_id, participation_type, status)
    values(new.season_id, new.player_id, 'rostered', 'active')
    on conflict on constraint season_players_season_id_player_id_key
    do update set participation_type = 'rostered', status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists auto_register_rostered_member on public.team_memberships;
create trigger auto_register_rostered_member
after insert on public.team_memberships
for each row execute function private.auto_register_rostered_member_trigger();

insert into public.season_players(season_id, player_id, participation_type, status)
select distinct tm.season_id, tm.player_id, 'rostered', 'active'
from public.team_memberships tm
join public.seasons s on s.id = tm.season_id and s.status = 'registration'
where tm.ends_at is null
on conflict on constraint season_players_season_id_player_id_key
do update set participation_type = 'rostered', status = 'active';

create or replace function public.list_public_season_registration()
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
language plpgsql
security definer
set search_path = ''
as $$
declare
  season_row record;
begin
  for season_row in select s.id from public.seasons s loop
    perform private.expire_season_team_registration(season_row.id);
  end loop;

  return query
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
          select 1 from public.team_memberships active_tm
          where active_tm.season_id = s.id
            and active_tm.player_id = sp.player_id
            and active_tm.ends_at is null
        )
    )::integer,
    (
      select coalesce(sum(greatest(0, 4 - (
        select count(*)
        from public.team_memberships spot_tm
        where spot_tm.team_id = spot_slot.team_id
          and spot_tm.ends_at is null
      ))), 0)::integer
      from private.season_team_slots spot_slot
      where spot_slot.season_id = s.id
        and spot_slot.team_id is not null
        and spot_slot.status in ('approved_pending_roster', 'ready', 'confirmed')
    ),
    count(distinct sts.team_id) filter (
      where sts.status = 'confirmed'
        and private.committed_team_roster_count(sts.team_id, sts.season_id)
            < s.minimum_committed_roster
    )::integer
  from public.seasons s
  left join private.season_team_slots sts on sts.season_id = s.id
  left join private.team_applications ta on ta.season_id = s.id
  left join public.team_memberships tm on tm.season_id = s.id
  left join public.season_players sp on sp.season_id = s.id
  group by s.id
  order by s.created_at desc;
end;
$$;

create or replace function public.get_admin_season_registration(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(registration jsonb)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  perform private.expire_season_team_registration(target_season_id);

  return query
  select jsonb_build_object(
    'seasonId', s.id,
    'seasonName', s.name,
    'seasonStatus', s.status,
    'teamCapacity', s.team_capacity,
    'minimumCommittedRoster', s.minimum_committed_roster,
    'returningReservationDeadline', s.returning_reservation_deadline,
    'conditionalHoldDays', s.conditional_hold_days,
    'counts', jsonb_build_object(
      'occupiedSlots', count(distinct sts.id) filter (
        where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
      ),
      'confirmedTeams', count(distinct sts.team_id) filter (where sts.status = 'confirmed'),
      'reservedReturningSlots', count(distinct sts.id) filter (where sts.status in ('reserved', 'transferred')),
      'heldTeams', count(distinct sts.id) filter (where sts.status in ('approved_pending_roster', 'ready')),
      'availableSlots', greatest(0, s.team_capacity - count(distinct sts.id) filter (
        where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
      )),
      'applicationsWaiting', count(distinct ta.id) filter (where ta.status in ('applied', 'deferred')),
      'rosteredPlayers', count(distinct tm.player_id) filter (where tm.ends_at is null),
      'registeredPlayers', count(distinct sp.player_id) filter (where sp.status = 'active'),
      'freeAgents', count(distinct sp.player_id) filter (
        where sp.status = 'active'
          and not exists (
            select 1 from public.team_memberships free_tm
            where free_tm.season_id = s.id
              and free_tm.player_id = sp.player_id
              and free_tm.ends_at is null
          )
      ),
      'openPrimaryRosterSpots', (
        select coalesce(sum(greatest(0, 4 - (
          select count(*)
          from public.team_memberships spot_tm
          where spot_tm.team_id = spot_slot.team_id
            and spot_tm.ends_at is null
        ))), 0)
        from private.season_team_slots spot_slot
        where spot_slot.season_id = s.id
          and spot_slot.team_id is not null
          and spot_slot.status in ('approved_pending_roster', 'ready', 'confirmed')
      ),
      'pendingInvitations', count(distinct ti.id) filter (where ti.status = 'pending')
    ),
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'applicationId', app.id,
        'proposedTeamName', app.proposed_team_name,
        'status', app.status,
        'applicantPlayerId', p.id,
        'applicantDisplayName', p.display_name,
        'submittedAt', app.submitted_at,
        'reviewedAt', app.reviewed_at,
        'adminNotes', app.admin_notes,
        'teamId', app.team_id,
        'slotId', app.slot_id
      ) order by app.submitted_at)
      from private.team_applications app
      join public.players p on p.id = app.applicant_player_id
      where app.season_id = s.id
    ), '[]'::jsonb),
    'slots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slotId', slot.id,
        'status', slot.status,
        'teamId', slot.team_id,
        'teamName', current_team.name,
        'sourceTeamId', slot.source_team_id,
        'sourceTeamName', source_team.name,
        'captainPlayerId', slot.assigned_captain_player_id,
        'captainDisplayName', captain.display_name,
        'activeRosterCount', (
          select count(*) from public.team_memberships active_tm
          where active_tm.team_id = slot.team_id and active_tm.ends_at is null
        ),
        'committedRosterCount', private.committed_team_roster_count(
          slot.team_id,
          slot.season_id
        ),
        'reservationExpiresAt', slot.reservation_expires_at,
        'holdExpiresAt', slot.hold_expires_at,
        'lastActionReason', slot.last_action_reason
      ) order by coalesce(current_team.name, source_team.name))
      from private.season_team_slots slot
      left join public.teams current_team on current_team.id = slot.team_id
      left join public.teams source_team on source_team.id = slot.source_team_id
      left join public.players captain on captain.id = slot.assigned_captain_player_id
      where slot.season_id = s.id
    ), '[]'::jsonb)
  )
  from public.seasons s
  left join private.season_team_slots sts on sts.season_id = s.id
  left join private.team_applications ta on ta.season_id = s.id
  left join public.team_memberships tm on tm.season_id = s.id
  left join public.season_players sp on sp.season_id = s.id
  left join private.team_invitations ti on ti.season_id = s.id
  where s.id = target_season_id
  group by s.id;
end;
$$;

revoke execute on function private.auto_register_rostered_member_trigger()
  from public, anon, authenticated;
revoke execute on function public.list_public_season_registration()
  from public, anon, authenticated;
grant execute on function public.list_public_season_registration() to service_role;
