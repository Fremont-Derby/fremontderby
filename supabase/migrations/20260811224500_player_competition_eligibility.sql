create table private.player_competition_restrictions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  player_id uuid not null references public.players(id) on delete restrict,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  restricted_by uuid not null references auth.users(id) on delete restrict,
  restricted_at timestamptz not null default now(),
  lifted_by uuid references auth.users(id) on delete restrict,
  lifted_at timestamptz,
  lift_reason text check (lift_reason is null or char_length(btrim(lift_reason)) between 1 and 500),
  check ((lifted_at is null and lifted_by is null) or (lifted_at is not null and lifted_by is not null))
);

create unique index player_competition_restrictions_active_unique
  on private.player_competition_restrictions (season_id, player_id)
  where lifted_at is null;

create index player_competition_restrictions_player_history_idx
  on private.player_competition_restrictions (player_id, season_id, restricted_at desc);

alter table private.player_competition_restrictions enable row level security;
revoke all on private.player_competition_restrictions from public, anon, authenticated;
grant select, insert, update on private.player_competition_restrictions to service_role;

create or replace function private.active_player_competition_restriction(
  target_season_id uuid,
  target_player_id uuid
)
returns table (restriction_id uuid, reason text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.reason
  from private.player_competition_restrictions r
  where r.season_id = target_season_id
    and r.player_id = target_player_id
    and r.lifted_at is null
  limit 1;
$$;

revoke all on function private.active_player_competition_restriction(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.active_player_competition_restriction(uuid, uuid)
  to service_role;

create or replace function public.list_admin_players(actor_user_id uuid)
returns table (
  player_id uuid,
  display_name text,
  has_login boolean,
  is_league_admin boolean,
  teams jsonb,
  current_season_id uuid,
  current_season_name text,
  registration_status text,
  payment_status text,
  competition_eligible boolean,
  ineligibility_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_season public.seasons%rowtype;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  select * into active_season
  from public.seasons s
  where s.status <> 'complete'
  order by s.created_at desc, s.id desc
  limit 1;

  return query
  select
    p.id,
    p.display_name,
    p.user_id is not null,
    exists (
      select 1 from private.league_admins la where la.user_id = p.user_id
    ),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'teamId', t.id,
          'teamName', t.name,
          'seasonId', s.id,
          'seasonName', s.name,
          'role', tm.role
        ) order by s.created_at desc, t.name
      )
      from public.team_memberships tm
      join public.teams t on t.id = tm.team_id
      join public.seasons s on s.id = tm.season_id
      where tm.player_id = p.id
        and tm.ends_at is null
    ), '[]'::jsonb),
    active_season.id,
    active_season.name,
    (
      select sp.status
      from public.season_players sp
      where sp.season_id = active_season.id and sp.player_id = p.id
      limit 1
    ),
    (
      select ps.status
      from private.payment_status ps
      where ps.season_id = active_season.id and ps.player_id = p.id
      limit 1
    ),
    not exists (
      select 1
      from private.player_competition_restrictions r
      where r.season_id = active_season.id
        and r.player_id = p.id
        and r.lifted_at is null
    ),
    (
      select r.reason
      from private.player_competition_restrictions r
      where r.season_id = active_season.id
        and r.player_id = p.id
        and r.lifted_at is null
      limit 1
    )
  from public.players p
  order by lower(p.display_name), p.id;
end;
$$;

create or replace function public.set_player_competition_eligibility(
  actor_user_id uuid,
  target_season_id uuid,
  target_player_id uuid,
  eligible boolean,
  change_reason text default null
)
returns table (
  player_id uuid,
  season_id uuid,
  competition_eligible boolean,
  ineligibility_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_restriction private.player_competition_restrictions%rowtype;
  normalized_reason text;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;
  if eligible is null then raise exception 'eligible is required'; end if;

  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then raise exception 'Actor is not a league admin'; end if;

  if not exists (select 1 from public.seasons s where s.id = target_season_id) then
    raise exception 'Season not found';
  end if;
  if not exists (select 1 from public.players p where p.id = target_player_id) then
    raise exception 'Player not found';
  end if;

  normalized_reason := nullif(btrim(change_reason), '');
  if normalized_reason is not null and char_length(normalized_reason) > 500 then
    raise exception 'reason must be 500 characters or fewer';
  end if;
  if not eligible and normalized_reason is null then
    raise exception 'A reason is required to mark a player ineligible';
  end if;

  select * into existing_restriction
  from private.player_competition_restrictions r
  where r.season_id = target_season_id
    and r.player_id = target_player_id
    and r.lifted_at is null
  for update;

  if eligible then
    if found then
      update private.player_competition_restrictions r
      set lifted_by = actor_user_id,
          lifted_at = now(),
          lift_reason = normalized_reason
      where r.id = existing_restriction.id;

      insert into private.audit_events(
        actor_user_id, action, entity_type, entity_id, reason, before_state, after_state
      ) values (
        actor_user_id,
        'player.restore_competition_eligibility',
        'player',
        target_player_id,
        normalized_reason,
        jsonb_build_object(
          'seasonId', target_season_id,
          'competitionEligible', false,
          'reason', existing_restriction.reason
        ),
        jsonb_build_object('seasonId', target_season_id, 'competitionEligible', true)
      );
    end if;
  else
    if found then
      if existing_restriction.reason is distinct from normalized_reason then
        update private.player_competition_restrictions r
        set reason = normalized_reason,
            restricted_by = actor_user_id,
            restricted_at = now()
        where r.id = existing_restriction.id;

        insert into private.audit_events(
          actor_user_id, action, entity_type, entity_id, reason, before_state, after_state
        ) values (
          actor_user_id,
          'player.update_competition_ineligibility',
          'player',
          target_player_id,
          normalized_reason,
          jsonb_build_object(
            'seasonId', target_season_id,
            'competitionEligible', false,
            'reason', existing_restriction.reason
          ),
          jsonb_build_object(
            'seasonId', target_season_id,
            'competitionEligible', false,
            'reason', normalized_reason
          )
        );
      end if;
    else
      insert into private.player_competition_restrictions(
        season_id, player_id, reason, restricted_by
      ) values (
        target_season_id, target_player_id, normalized_reason, actor_user_id
      );

      insert into private.audit_events(
        actor_user_id, action, entity_type, entity_id, reason, before_state, after_state
      ) values (
        actor_user_id,
        'player.mark_competition_ineligible',
        'player',
        target_player_id,
        normalized_reason,
        jsonb_build_object('seasonId', target_season_id, 'competitionEligible', true),
        jsonb_build_object(
          'seasonId', target_season_id,
          'competitionEligible', false,
          'reason', normalized_reason
        )
      );
    end if;
  end if;

  return query
  select
    target_player_id,
    target_season_id,
    not exists (
      select 1 from private.player_competition_restrictions r
      where r.season_id = target_season_id
        and r.player_id = target_player_id
        and r.lifted_at is null
    ),
    (
      select r.reason
      from private.player_competition_restrictions r
      where r.season_id = target_season_id
        and r.player_id = target_player_id
        and r.lifted_at is null
      limit 1
    );
end;
$$;

revoke all on function public.list_admin_players(uuid) from public, anon, authenticated;
grant execute on function public.list_admin_players(uuid) to service_role;
revoke all on function public.set_player_competition_eligibility(uuid, uuid, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.set_player_competition_eligibility(uuid, uuid, uuid, boolean, text)
  to service_role;

create or replace function private.reject_ineligible_lineup_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  restriction_reason text;
begin
  if new.player_id is null then return new; end if;

  select r.reason into restriction_reason
  from private.player_competition_restrictions r
  where r.season_id = new.season_id
    and r.player_id = new.player_id
    and r.lifted_at is null
  limit 1;

  if restriction_reason is not null then
    raise exception 'Player is marked ineligible for competition: %', restriction_reason;
  end if;
  return new;
end;
$$;

create or replace function private.reject_ineligible_score_advance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  restriction_reason text;
  old_rack_count integer := 0;
  new_rack_count integer := 0;
begin
  if tg_table_name = 'player_match_score_submissions' then
    new_rack_count := coalesce(jsonb_array_length(new.racks), 0);
    if tg_op = 'UPDATE' then
      old_rack_count := coalesce(jsonb_array_length(old.racks), 0);
    end if;
    if new_rack_count <= old_rack_count then return new; end if;
  end if;

  select * into target_match
  from public.player_matches pm
  where pm.id = new.player_match_id;
  if not found then return new; end if;

  select r.reason into restriction_reason
  from private.player_competition_restrictions r
  where r.season_id = target_match.season_id
    and r.player_id in (target_match.player_a_id, target_match.player_b_id)
    and r.lifted_at is null
  order by r.restricted_at
  limit 1;

  if restriction_reason is not null then
    raise exception 'Player is marked ineligible for competition: %', restriction_reason;
  end if;
  return new;
end;
$$;

revoke all on function private.reject_ineligible_lineup_slot() from public, anon, authenticated;
revoke all on function private.reject_ineligible_score_advance() from public, anon, authenticated;

drop trigger if exists team_lineup_slots_competition_eligibility on private.team_lineup_slots;
create trigger team_lineup_slots_competition_eligibility
before insert or update of player_id, season_id on private.team_lineup_slots
for each row execute function private.reject_ineligible_lineup_slot();

drop trigger if exists team_score_submissions_competition_eligibility on private.player_match_score_submissions;
create trigger team_score_submissions_competition_eligibility
before insert or update of racks on private.player_match_score_submissions
for each row execute function private.reject_ineligible_score_advance();

drop trigger if exists legacy_match_racks_competition_eligibility on public.player_match_racks;
create trigger legacy_match_racks_competition_eligibility
before insert on public.player_match_racks
for each row execute function private.reject_ineligible_score_advance();

comment on table private.player_competition_restrictions is
  'Season-scoped league-admin competition restrictions. Historical rows are lifted, never deleted.';
comment on function public.set_player_competition_eligibility(uuid, uuid, uuid, boolean, text) is
  'Service-role-only audited league-admin command for season-scoped competition eligibility.';
