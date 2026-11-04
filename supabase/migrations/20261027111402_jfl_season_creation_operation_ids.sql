-- #3652 source preparation: additive JFL protocol, not applied until full wiring.
begin;
set local lock_timeout='5s';
set local statement_timeout='20s';
do $guard$
begin
 if (select md5(prosrc) from pg_proc where oid='jfl.create_season_setup(uuid,text,text,date,integer,integer,integer,integer,integer[],text,integer,boolean,text)'::regprocedure) is distinct from '9adbe9e0f74bf7b85771b143e24fbf62'
  or md5(pg_get_functiondef('jfl.configure_season_setup(uuid,uuid,text,text,date,integer,integer,integer,integer,integer[],text,integer,boolean)'::regprocedure)) is distinct from 'b3abc05cea926edd8860103653569760'
 then raise exception 'Qualified JFL season creation/configuration contract changed';end if;
 if to_regclass('jfl_private.season_creation_operations') is not null
  or to_regprocedure('jfl.create_season_setup_once(uuid,uuid,jsonb)') is not null
  or to_regprocedure('jfl.read_season_creation_operation(uuid,uuid)') is not null
 then raise exception 'Season operation protocol already exists; reconcile migration history';end if;
end
$guard$;
create table jfl_private.season_creation_operations(
 operation_id uuid primary key,
 actor_user_id uuid not null references auth.users(id) on delete restrict,
 requested_input jsonb not null check(jsonb_typeof(requested_input)='object'),
 season_id uuid references jfl.seasons(id) on delete set null,
 created_at timestamptz not null default now()
);
alter table jfl_private.season_creation_operations enable row level security;
revoke all on jfl_private.season_creation_operations from public,anon,authenticated,service_role;

create function jfl.create_season_setup_once(actor_user_id uuid,operation_id uuid,creation_input jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $create_once$
declare
 normalized jsonb;
 prior_operation jfl_private.season_creation_operations%rowtype;
 created_id uuid;
 setup jsonb;
begin
 perform 1 from jfl_private.league_admins a where a.user_id=actor_user_id for share;
 if not found then raise exception using errcode='42501',message='Actor is not a league admin';end if;
 if operation_id is null or operation_id='00000000-0000-0000-0000-000000000000'::uuid then
  raise exception using errcode='22023',message='A non-nil creation operation is required';end if;
 if creation_input is null or jsonb_typeof(creation_input)<>'object' then
  raise exception using errcode='22023',message='Creation input must be an object';end if;
 if not(creation_input ?& array['configured_season_name','configured_league_night','configured_first_round_date',
  'configured_roster_lock_round','configured_opening_block_length','configured_individual_min_matches',
  'configured_round_interval_days','configured_table_numbers','configured_race_chart_version',
  'configured_playoff_team_count','configured_playoff_anchor_tiebreaker','configured_purpose'])
  or exists(select 1 from jsonb_object_keys(creation_input) k where k<>all(array[
   'configured_season_name','configured_league_night','configured_first_round_date','configured_roster_lock_round',
   'configured_opening_block_length','configured_individual_min_matches','configured_round_interval_days',
   'configured_table_numbers','configured_race_chart_version','configured_playoff_team_count',
   'configured_playoff_anchor_tiebreaker','configured_purpose']))
 then raise exception using errcode='22023',message='Exact season creation fields are required';end if;
 -- Bind canonical typed arguments; the unchanged constructor remains the only
 -- owner of business validation, insertion, configuration and normal audit.
 normalized:=jsonb_build_object(
  'configured_season_name',btrim(creation_input->>'configured_season_name'),
  'configured_league_night',btrim(creation_input->>'configured_league_night'),
  'configured_first_round_date',(creation_input->>'configured_first_round_date')::date,
  'configured_roster_lock_round',(creation_input->>'configured_roster_lock_round')::int,
  'configured_opening_block_length',(creation_input->>'configured_opening_block_length')::int,
  'configured_individual_min_matches',(creation_input->>'configured_individual_min_matches')::int,
  'configured_round_interval_days',(creation_input->>'configured_round_interval_days')::int,
  'configured_table_numbers',array(select jsonb_array_elements_text(creation_input->'configured_table_numbers'))::int[],
  'configured_race_chart_version',btrim(creation_input->>'configured_race_chart_version'),
  'configured_playoff_team_count',(creation_input->>'configured_playoff_team_count')::int,
  'configured_playoff_anchor_tiebreaker',coalesce((creation_input->>'configured_playoff_anchor_tiebreaker')::boolean,true),
  'configured_purpose',creation_input->>'configured_purpose');
 perform pg_advisory_xact_lock(hashtextextended(operation_id::text,3652));
 select o.* into prior_operation from jfl_private.season_creation_operations o
  where o.operation_id=create_season_setup_once.operation_id for update;
 if found then
  if prior_operation.actor_user_id is distinct from actor_user_id or prior_operation.requested_input is distinct from normalized then
   raise exception using errcode='23514',message='Season creation operation does not match this action';end if;
  if prior_operation.season_id is null then raise exception using errcode='23514',message='Created season is no longer available';end if;
  select to_jsonb(s) into setup from jfl.get_season_setup(actor_user_id,prior_operation.season_id) s;
  if setup is null then raise exception using errcode='23514',message='Created season is no longer available';end if;
  -- Caller must load current state; this acknowledgment never reapplies setup
  -- or a registration draft to a season that may since have been edited.
  return jsonb_build_object('created',false,'setup',setup,'requestedInput',normalized);
 end if;
 select created.id into created_id from jfl.create_season_setup(actor_user_id,
  normalized->>'configured_season_name',normalized->>'configured_league_night',
  (normalized->>'configured_first_round_date')::date,(normalized->>'configured_roster_lock_round')::int,
  (normalized->>'configured_opening_block_length')::int,(normalized->>'configured_individual_min_matches')::int,
  (normalized->>'configured_round_interval_days')::int,
  array(select jsonb_array_elements_text(normalized->'configured_table_numbers'))::int[],
  normalized->>'configured_race_chart_version',(normalized->>'configured_playoff_team_count')::int,
  (normalized->>'configured_playoff_anchor_tiebreaker')::boolean,normalized->>'configured_purpose') created;
 if created_id is null then raise exception 'New season was not confirmed';end if;
 insert into jfl_private.season_creation_operations(operation_id,actor_user_id,requested_input,season_id)
  values(operation_id,actor_user_id,normalized,created_id);
 select to_jsonb(s) into setup from jfl.get_season_setup(actor_user_id,created_id) s;
 return jsonb_build_object('created',true,'setup',setup,'requestedInput',normalized);
end
$create_once$;
revoke all on function jfl.create_season_setup_once(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function jfl.create_season_setup_once(uuid,uuid,jsonb) to service_role;

create function jfl.read_season_creation_operation(actor_user_id uuid,operation_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $read_operation$
declare prior_operation jfl_private.season_creation_operations%rowtype;setup jsonb;
begin
 perform 1 from jfl_private.league_admins a where a.user_id=actor_user_id for share;
 if not found then raise exception using errcode='42501',message='Actor is not a league admin';end if;
 if operation_id is null or operation_id='00000000-0000-0000-0000-000000000000'::uuid then
  raise exception using errcode='22023',message='A non-nil creation operation is required';end if;
 select o.* into prior_operation from jfl_private.season_creation_operations o
  where o.operation_id=read_season_creation_operation.operation_id;
 if not found then return null;end if;
 if prior_operation.actor_user_id is distinct from actor_user_id then
  raise exception using errcode='42501',message='Actor is not authorized for this creation operation';end if;
 if prior_operation.season_id is null then raise exception using errcode='23514',message='Created season is no longer available';end if;
 select to_jsonb(s) into setup from jfl.get_season_setup(actor_user_id,prior_operation.season_id) s;
 if setup is null then raise exception using errcode='23514',message='Created season is no longer available';end if;
 return jsonb_build_object('setup',setup,'requestedInput',prior_operation.requested_input);
end
$read_operation$;
revoke all on function jfl.read_season_creation_operation(uuid,uuid) from public,anon,authenticated;
grant execute on function jfl.read_season_creation_operation(uuid,uuid) to service_role;
commit;
