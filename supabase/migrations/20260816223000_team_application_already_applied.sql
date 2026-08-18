-- Clear product error when applicant already has an active team application.

CREATE OR REPLACE FUNCTION public.submit_team_application(actor_user_id uuid, target_season_id uuid, proposed_team_name text)
 RETURNS TABLE(id uuid, season_id uuid, status text, team_name text, submitted_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_player_id uuid;
  normalized_name text;
  inserted_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  normalized_name := btrim(proposed_team_name);
  if normalized_name is null or char_length(normalized_name) not between 1 and 80 then
    raise exception 'proposed_team_name must be 80 characters or fewer';
  end if;

  if not exists (
    select 1 from public.seasons s
    where s.id = target_season_id and s.status = 'registration'
  ) then
    raise exception 'Season is not open for team applications';
  end if;

  perform private.expire_season_team_registration(target_season_id);

  select p.id into actor_player_id
  from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before applying for a team'; end if;

  if exists (
    select 1 from public.teams t
    where t.season_id = target_season_id
      and lower(btrim(t.name)) = lower(normalized_name)
  ) or exists (
    select 1
    from private.season_team_slots sts
    join public.teams source_team on source_team.id = sts.source_team_id
    where sts.season_id = target_season_id
      and sts.status in ('reserved', 'transferred')
      and lower(btrim(source_team.name)) = lower(normalized_name)
  ) then
    raise exception 'That team name is already reserved for this season';
  end if;

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'You already captain a team in this season';
  end if;

  if exists (
    select 1 from private.team_applications ta
    where ta.season_id = target_season_id
      and ta.applicant_player_id = actor_player_id
      and ta.status in ('applied', 'deferred', 'approved_pending_roster', 'ready', 'confirmed')
  ) then
    raise exception 'You already have a team application in this season';
  end if;

  insert into private.team_applications(
    season_id, applicant_player_id, proposed_team_name
  ) values (
    target_season_id, actor_player_id, normalized_name
  ) returning private.team_applications.id into inserted_id;

  return query
  select ta.id, ta.season_id, ta.status, ta.proposed_team_name, ta.submitted_at
  from private.team_applications ta where ta.id = inserted_id;
end;
$function$;

comment on function public.submit_team_application(uuid, uuid, text) is
  'Submit a team application during registration; rejects duplicate active applications.';
