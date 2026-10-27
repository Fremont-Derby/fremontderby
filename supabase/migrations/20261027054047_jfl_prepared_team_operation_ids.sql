-- #3649: bind one authenticated Admin creation intent to one team/audit result.
-- JFL-only additive protocol. Legacy creation and all existing grants stay intact.
begin;
set local lock_timeout='5s';
set local statement_timeout='20s';
do $guard$
begin
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='jfl' and p.proname='admin_create_prepared_team'
      and pg_get_function_identity_arguments(p.oid)='actor_user_id uuid, target_season_id uuid, team_name text'
      and p.prosecdef and md5(p.prosrc)='06c1ad531576def78275d584caaa72b3') then
    raise exception 'Qualified JFL prepared-team creation contract changed';
  end if;
  if to_regclass('jfl_private.prepared_team_creation_operations') is not null
    or to_regprocedure('jfl.admin_create_prepared_team_once(uuid,uuid,text,uuid)') is not null then
    raise exception 'Prepared-team operation protocol already exists; investigate migration history';
  end if;
end
$guard$;

create table jfl_private.prepared_team_creation_operations(
  operation_id uuid primary key,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  season_id uuid not null references jfl.seasons(id) on delete cascade,
  normalized_name text not null check(char_length(normalized_name) between 1 and 80),
  team_id uuid references jfl.teams(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table jfl_private.prepared_team_creation_operations enable row level security;
revoke all on table jfl_private.prepared_team_creation_operations from public,anon,authenticated,service_role;

create function jfl.admin_create_prepared_team_once(
  actor_user_id uuid,target_season_id uuid,team_name text,operation_id uuid
) returns table(id uuid,season_id uuid,name text)
language plpgsql security definer set search_path=''
as $operation$
declare
  request_name text:=btrim(team_name);
  prior_operation jfl_private.prepared_team_creation_operations%rowtype;
  created_id uuid;
begin
  -- Lock the authorization row through commit so concurrent revocation cannot
  -- slip between the check and the legacy creation operation.
  perform 1 from jfl_private.league_admins a where a.user_id=actor_user_id for share;
  if not found then raise exception using errcode='42501',message='Actor is not a league admin'; end if;
  if operation_id is null or operation_id='00000000-0000-0000-0000-000000000000'::uuid
    or target_season_id is null then
    raise exception using errcode='22023',message='A valid operation and season are required';
  end if;
  if request_name is null or char_length(request_name) not between 1 and 80 then
    raise exception using errcode='22023',message='A team name from 1 to 80 characters is required';
  end if;

  -- One lock per operation serializes competing equivalent requests, including
  -- the no-row-yet case. A collision can delay a caller but cannot mix results.
  perform pg_advisory_xact_lock(hashtextextended(operation_id::text,3649));
  select o.* into prior_operation from jfl_private.prepared_team_creation_operations o
    where o.operation_id=admin_create_prepared_team_once.operation_id for update;
  if found then
    if prior_operation.actor_user_id is distinct from actor_user_id
      or prior_operation.season_id is distinct from target_season_id
      or prior_operation.normalized_name is distinct from request_name then
      raise exception using errcode='23514',message='Creation operation does not match this action';
    end if;
    if prior_operation.team_id is null or not exists(select 1 from jfl.teams t
      where t.id=prior_operation.team_id and t.season_id=target_season_id
        and t.created_by=actor_user_id) then
      raise exception using errcode='23514',message='Creation result is no longer available';
    end if;
    return query select t.id,t.season_id,t.name from jfl.teams t where t.id=prior_operation.team_id;
    return;
  end if;

  -- Preserve the reviewed legacy validation, season lock, global-name policy
  -- and single creation audit. The mapping commits atomically with that work.
  select created.id into created_id
    from jfl.admin_create_prepared_team(actor_user_id,target_season_id,request_name) created;
  if created_id is null then raise exception 'Prepared team creation was not confirmed'; end if;
  insert into jfl_private.prepared_team_creation_operations(operation_id,actor_user_id,season_id,normalized_name,team_id)
    values(operation_id,actor_user_id,target_season_id,request_name,created_id);
  return query select t.id,t.season_id,t.name from jfl.teams t where t.id=created_id;
end
$operation$;
revoke all on function jfl.admin_create_prepared_team_once(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function jfl.admin_create_prepared_team_once(uuid,uuid,text,uuid) to service_role;
comment on table jfl_private.prepared_team_creation_operations is
  '#3649 exact actor/season/name-bound prepared-team creation intents; no automatic POST replay';

-- A supported GET can confirm a lost response without replaying creation.
create function jfl.admin_read_prepared_team_operation(
  actor_user_id uuid,target_season_id uuid,operation_id uuid
) returns table(id uuid,season_id uuid,name text,requested_name text)
language plpgsql security definer set search_path=''
as $read_operation$
declare prior_operation jfl_private.prepared_team_creation_operations%rowtype;
begin
  perform 1 from jfl_private.league_admins a where a.user_id=actor_user_id for share;
  if not found then raise exception using errcode='42501',message='Actor is not a league admin'; end if;
  if operation_id is null or operation_id='00000000-0000-0000-0000-000000000000'::uuid
    or target_season_id is null then
    raise exception using errcode='22023',message='A valid operation and season are required';
  end if;
  select o.* into prior_operation from jfl_private.prepared_team_creation_operations o
    where o.operation_id=admin_read_prepared_team_operation.operation_id;
  if not found then return; end if;
  if prior_operation.actor_user_id is distinct from actor_user_id
    or prior_operation.season_id is distinct from target_season_id then
    raise exception using errcode='42501',message='Actor is not authorized for this creation operation';
  end if;
  if prior_operation.team_id is null then
    raise exception using errcode='23514',message='Creation result is no longer available';
  end if;
  return query select t.id,t.season_id,t.name,prior_operation.normalized_name from jfl.teams t
    where t.id=prior_operation.team_id and t.season_id=target_season_id and t.created_by=actor_user_id;
  if not found then raise exception using errcode='23514',message='Creation result is no longer available'; end if;
end
$read_operation$;
revoke all on function jfl.admin_read_prepared_team_operation(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function jfl.admin_read_prepared_team_operation(uuid,uuid,uuid) to service_role;
commit;
