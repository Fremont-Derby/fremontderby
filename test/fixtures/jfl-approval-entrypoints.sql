-- Read-only snapshot of the qualified JFL entrypoints at 0a02232d.
-- Local SQL fixture only. Never apply this file to a hosted database.
CREATE OR REPLACE FUNCTION jfl.admin_review_team_application(actor_user_id uuid, target_application_id uuid, review_decision text, review_reason text)
 RETURNS TABLE(application_id uuid, application_status text, team_id uuid, slot_id uuid, hold_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  application_row jfl_private.team_applications%rowtype;
  target_capacity integer;
  hold_days integer;
  occupied_slots integer;
  inserted_team_id uuid;
  inserted_slot_id uuid;
  target_hold_expires_at timestamptz;
begin
  if not exists (
    select 1 from jfl_private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if review_decision not in ('approve', 'defer', 'reject') then
    raise exception 'review_decision must be approve, defer, or reject';
  end if;

  select * into application_row
  from jfl_private.team_applications ta
  where ta.id = target_application_id
  for update;
  if not found then raise exception 'Team application not found'; end if;
  if application_row.status not in ('applied', 'deferred') then
    raise exception 'Team application is no longer waiting for review';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'season_team_capacity:' || application_row.season_id::text, 0
  ));
  perform jfl_private.expire_season_team_registration(application_row.season_id);

  if review_decision in ('defer', 'reject') then
    update jfl_private.team_applications ta
    set status = case when review_decision = 'defer' then 'deferred' else 'rejected' end,
        admin_notes = nullif(btrim(review_reason), ''),
        reviewed_at = now(),
        reviewed_by_user_id = actor_user_id,
        updated_at = now()
    where ta.id = target_application_id;
  else
    select s.team_capacity, s.conditional_hold_days
    into target_capacity, hold_days
    from jfl.seasons s
    where s.id = application_row.season_id
      and s.status = 'registration'
    for update;
    if not found then raise exception 'Season is not open for team applications'; end if;

    select count(*)::integer into occupied_slots
    from jfl_private.season_team_slots sts
    where sts.season_id = application_row.season_id
      and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed');

    if occupied_slots >= target_capacity then
      raise exception 'No team slots are currently available';
    end if;

    if exists (
      select 1 from jfl.team_memberships tm
      where tm.season_id = application_row.season_id
        and tm.player_id = application_row.applicant_player_id
        and tm.role = 'captain'
        and tm.ends_at is null
    ) then
      raise exception 'Applicant already captains a team in this season';
    end if;

    if exists (
      select 1 from jfl.teams t
      where t.season_id = application_row.season_id
        and lower(btrim(t.name)) = lower(btrim(application_row.proposed_team_name))
    ) or exists (
      select 1
      from jfl_private.season_team_slots sts
      join jfl.teams source_team on source_team.id = sts.source_team_id
      where sts.season_id = application_row.season_id
        and sts.status in ('reserved', 'transferred')
        and lower(btrim(source_team.name)) = lower(btrim(application_row.proposed_team_name))
    ) then
      raise exception 'That team name is already reserved for this season';
    end if;

    insert into jfl.teams(season_id, name, created_by)
    select application_row.season_id, application_row.proposed_team_name, p.user_id
    from jfl.players p where p.id = application_row.applicant_player_id
    returning jfl.teams.id into inserted_team_id;

    insert into jfl.team_memberships(season_id, team_id, player_id, role)
    values (
      application_row.season_id,
      inserted_team_id,
      application_row.applicant_player_id,
      'captain'
    );

    target_hold_expires_at := now() + make_interval(days => hold_days);
    insert into jfl_private.season_team_slots(
      season_id, team_id, assigned_captain_player_id, status, hold_expires_at
    ) values (
      application_row.season_id,
      inserted_team_id,
      application_row.applicant_player_id,
      'approved_pending_roster',
      target_hold_expires_at
    ) returning jfl_private.season_team_slots.id into inserted_slot_id;

    update jfl_private.team_applications ta
    set status = 'approved_pending_roster',
        team_id = inserted_team_id,
        slot_id = inserted_slot_id,
        admin_notes = nullif(btrim(review_reason), ''),
        reviewed_at = now(),
        reviewed_by_user_id = actor_user_id,
        updated_at = now()
    where ta.id = target_application_id;

    perform jfl_private.refresh_team_slot_readiness(inserted_team_id);
  end if;

  insert into jfl_private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'team_application.' || review_decision,
    'team_application',
    target_application_id,
    jsonb_build_object('reason', nullif(btrim(review_reason), ''))
  );

  return query
  select ta.id, ta.status, ta.team_id, ta.slot_id, sts.hold_expires_at
  from jfl_private.team_applications ta
  left join jfl_private.season_team_slots sts on sts.id = ta.slot_id
  where ta.id = target_application_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION jfl.list_my_notifications(actor_user_id uuid, result_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, kind text, title text, body text, href text, team_id uuid, team_match_id uuid, season_id uuid, read_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    n.id,
    n.kind,
    n.title,
    n.body,
    n.href,
    n.team_id,
    n.team_match_id,
    n.season_id,
    n.read_at,
    n.created_at
  from jfl.user_notifications n
  where n.recipient_user_id = actor_user_id
  order by n.created_at desc
  limit greatest(1, least(coalesce(result_limit, 50), 100));
$function$
;
