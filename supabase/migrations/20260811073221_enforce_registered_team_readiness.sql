create or replace function private.committed_team_roster_count(
  target_team_id uuid,
  target_season_id uuid
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct tm.player_id)::integer
  from public.team_memberships tm
  join public.season_players sp
    on sp.season_id = tm.season_id
   and sp.player_id = tm.player_id
   and sp.status = 'active'
  where tm.team_id = target_team_id
    and tm.season_id = target_season_id
    and tm.ends_at is null;
$$;

create or replace function private.expire_season_team_registration(target_season_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.season_team_slots sts
  set status = 'expired',
      resolved_at = now(),
      updated_at = now(),
      last_action_reason = coalesce(sts.last_action_reason, 'Reservation deadline passed')
  where sts.season_id = target_season_id
    and sts.status in ('reserved', 'transferred')
    and sts.reservation_expires_at is not null
    and sts.reservation_expires_at <= now();

  with expired_holds as (
    update private.season_team_slots sts
    set status = 'expired',
        resolved_at = now(),
        updated_at = now(),
        last_action_reason = coalesce(sts.last_action_reason, 'Roster completion deadline passed')
    from public.seasons s
    where sts.season_id = target_season_id
      and s.id = sts.season_id
      and sts.status in ('approved_pending_roster', 'ready')
      and sts.hold_expires_at is not null
      and sts.hold_expires_at <= now()
      and private.committed_team_roster_count(sts.team_id, sts.season_id)
          < s.minimum_committed_roster
    returning sts.id
  )
  update private.team_applications ta
  set status = 'expired',
      updated_at = now(),
      admin_notes = coalesce(ta.admin_notes, 'Roster completion deadline passed')
  where ta.slot_id in (select id from expired_holds)
    and ta.status in ('approved_pending_roster', 'ready');
end;
$$;

create or replace function private.refresh_team_slot_readiness(target_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  committed_count integer;
  minimum_count integer;
  target_slot_id uuid;
  target_status text;
  target_season_id uuid;
begin
  select sts.id, sts.status, sts.season_id, s.minimum_committed_roster
  into target_slot_id, target_status, target_season_id, minimum_count
  from private.season_team_slots sts
  join public.seasons s on s.id = sts.season_id
  where sts.team_id = target_team_id
  order by sts.created_at desc
  limit 1
  for update of sts;

  if target_slot_id is null or target_status not in ('approved_pending_roster', 'ready') then
    return;
  end if;

  committed_count := private.committed_team_roster_count(
    target_team_id,
    target_season_id
  );

  if committed_count >= minimum_count and target_status = 'approved_pending_roster' then
    update private.season_team_slots
    set status = 'ready', updated_at = now()
    where id = target_slot_id;

    update private.team_applications
    set status = 'ready', updated_at = now()
    where slot_id = target_slot_id
      and status = 'approved_pending_roster';
  elsif committed_count < minimum_count and target_status = 'ready' then
    update private.season_team_slots
    set status = 'approved_pending_roster', updated_at = now()
    where id = target_slot_id;

    update private.team_applications
    set status = 'approved_pending_roster', updated_at = now()
    where slot_id = target_slot_id
      and status = 'ready';
  end if;
end;
$$;

create or replace function private.refresh_team_slots_for_season_player_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  team_row record;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    for team_row in
      select distinct tm.team_id
      from public.team_memberships tm
      where tm.season_id = old.season_id
        and tm.player_id = old.player_id
    loop
      perform private.refresh_team_slot_readiness(team_row.team_id);
    end loop;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    for team_row in
      select distinct tm.team_id
      from public.team_memberships tm
      where tm.season_id = new.season_id
        and tm.player_id = new.player_id
    loop
      perform private.refresh_team_slot_readiness(team_row.team_id);
    end loop;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_team_slots_on_season_player on public.season_players;
create trigger refresh_team_slots_on_season_player
after insert or update or delete on public.season_players
for each row execute function private.refresh_team_slots_for_season_player_trigger();

create or replace function private.enforce_committed_roster_on_slot_confirmation_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  minimum_count integer;
begin
  if old.status in ('approved_pending_roster', 'ready')
      and new.status = 'confirmed' then
    select s.minimum_committed_roster into minimum_count
    from public.seasons s where s.id = new.season_id;

    if private.committed_team_roster_count(new.team_id, new.season_id) < minimum_count then
      raise exception 'Team must meet the minimum committed roster before confirmation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_committed_roster_on_slot_confirmation
  on private.season_team_slots;
create trigger enforce_committed_roster_on_slot_confirmation
before update of status on private.season_team_slots
for each row execute function private.enforce_committed_roster_on_slot_confirmation_trigger();

create or replace function private.enforce_viable_teams_before_season_publication_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  viable_count integer;
begin
  if old.status in ('draft', 'registration') and new.status = 'active' then
    perform private.expire_season_team_registration(new.id);
    select count(*)::integer into viable_count
    from private.season_team_slots sts
    where sts.season_id = new.id
      and sts.status = 'confirmed'
      and private.committed_team_roster_count(sts.team_id, sts.season_id)
          >= new.minimum_committed_roster;

    if viable_count <> new.team_capacity then
      raise exception 'Season requires exactly % confirmed teams with at least % committed players before publication',
        new.team_capacity, new.minimum_committed_roster;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_viable_teams_before_season_publication on public.seasons;
create trigger enforce_viable_teams_before_season_publication
before update of status on public.seasons
for each row execute function private.enforce_viable_teams_before_season_publication_trigger();

create or replace function public.list_publishable_season_teams(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(id uuid, active boolean)
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
  select sts.team_id, true
  from private.season_team_slots sts
  join public.seasons s on s.id = sts.season_id
  join public.teams t on t.id = sts.team_id
  where sts.season_id = target_season_id
    and sts.status = 'confirmed'
    and private.committed_team_roster_count(sts.team_id, sts.season_id)
        >= s.minimum_committed_roster
  order by t.name;
end;
$$;

drop function public.list_public_season_registration();
create function public.list_public_season_registration()
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
        and sp.participation_type = 'free_agent'
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
          and sp.participation_type = 'free_agent'
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

do $$
declare
  slot_row record;
begin
  for slot_row in
    select sts.team_id
    from private.season_team_slots sts
    where sts.team_id is not null
      and sts.status in ('approved_pending_roster', 'ready')
  loop
    perform private.refresh_team_slot_readiness(slot_row.team_id);
  end loop;
end $$;

revoke execute on function private.committed_team_roster_count(uuid, uuid) from public, anon, authenticated;
revoke execute on function private.refresh_team_slots_for_season_player_trigger() from public, anon, authenticated;
revoke execute on function private.enforce_committed_roster_on_slot_confirmation_trigger() from public, anon, authenticated;
revoke execute on function private.enforce_viable_teams_before_season_publication_trigger() from public, anon, authenticated;
revoke execute on function public.list_public_season_registration() from public, anon, authenticated;
grant execute on function public.list_public_season_registration() to service_role;
