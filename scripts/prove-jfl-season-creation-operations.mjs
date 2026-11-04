// Emits rollback-only SQL. Execute only against the qualified isolated JFL project,
// while no reset, browser or SQL mutation owns the fixture.
import { readFileSync } from 'node:fs';
const mode = process.argv[2];
if (!['--candidate', '--applied'].includes(mode)) throw new Error('Use --candidate or --applied');
const migration = mode === '--candidate' ? readFileSync(new URL(
  '../supabase/migrations/20261027111402_jfl_season_creation_operation_ids.sql', import.meta.url,
), 'utf8').replace(/^begin;\s*$/mi, '').replace(/^commit;\s*$/mi, '') : '';
const history = ['jfl.seasons', 'jfl.teams', 'jfl.team_memberships', 'jfl.season_players', 'jfl.rounds',
  'jfl.team_matches', 'jfl.players', 'jfl_private.player_contacts', 'jfl_private.team_applications',
  'jfl_private.season_team_slots', 'jfl.user_notifications', 'jfl_private.audit_events',
  'jfl_private.audit_webhook_outbox', 'jfl.direct_message_consent', 'jfl.social_chat_consent'];
const hashes = "jsonb_build_object(" + history.map(name => "'" + name + "'," +
  "(select md5(coalesce(string_agg(to_jsonb(t)::text,'|' order by to_jsonb(t)::text),'')) from " + name + ' t)').join(',') + ')';
process.stdout.write(String.raw`
create temporary table season_creation_proof(result jsonb) on commit drop;
do $proof$
declare
 actor uuid := 'b22805b6-92ba-44bd-a92e-0c82f0be6613';
 outsider uuid; other_admin uuid;
 operation uuid := '36520000-5000-4000-8000-000000000091';
 absent_operation uuid := '36520000-5000-4000-8000-000000000092';
 input jsonb := '{"configured_season_name":"Synthetic rollback season operation","configured_league_night":"Tuesday","configured_first_round_date":"2026-11-03","configured_roster_lock_round":3,"configured_opening_block_length":3,"configured_individual_min_matches":5,"configured_round_interval_days":7,"configured_table_numbers":[1,2,3,4],"configured_race_chart_version":"season-1-default","configured_playoff_team_count":4,"configured_playoff_anchor_tiebreaker":true,"configured_purpose":"qa"}'::jsonb;
 before_hashes jsonb; before_operations integer := 0; root uuid; value jsonb; first_value jsonb;
 season_count integer; audit_count integer; checks integer := 0; proof jsonb;
begin
 if not exists(select 1 from jfl_private.league_admins where user_id=actor) then raise exception 'Qualified JFL admin missing';end if;
 select u.id into strict outsider from auth.users u where not exists(select 1 from jfl_private.league_admins a where a.user_id=u.id) order by u.id limit 1;
 select a.user_id into strict other_admin from jfl_private.league_admins a where a.user_id<>actor order by a.user_id limit 1;
 before_hashes := ${hashes};
 ${mode === '--applied' ? 'select count(*) into before_operations from jfl_private.season_creation_operations;' : ''}
 begin
 ${migration ? 'execute $migration$' + migration + '$migration$;' : ''}
 if exists(select 1 from jfl_private.season_creation_operations where operation_id in(operation,absent_operation)) then raise exception 'Proof identity already exists';end if;
 select count(*) into season_count from jfl.seasons;
 select count(*) into audit_count from jfl_private.audit_events;
 value := jfl.create_season_setup_once(actor,operation,input);first_value:=value;root:=(value->'setup'->>'id')::uuid;
 if value->>'created'<>'true' or root is null or (select count(*) from jfl.seasons)<>season_count+1 or (select count(*) from jfl_private.audit_events)<>audit_count+1 then raise exception 'Once creation/root/audit failed';end if;checks:=checks+1;
 if not exists(select 1 from jfl.seasons where id=root and purpose='qa' and status='registration') then raise exception 'QA isolation failed';end if;checks:=checks+1;
 value:=jfl.create_season_setup_once(actor,operation,input||'{"configured_season_name":"  Synthetic rollback season operation  "}');
 if value->>'created'<>'false' or (value->'setup'->>'id')::uuid<>root or (select count(*) from jfl.seasons)<>season_count+1 or (select count(*) from jfl_private.audit_events)<>audit_count+1 then raise exception 'Equivalent repeat changed data';end if;checks:=checks+1;
 value:=jfl.read_season_creation_operation(actor,operation);
 if value->'setup'->>'id'<>root::text or value->'requestedInput'<>input or jfl.read_season_creation_operation(actor,absent_operation) is not null then raise exception 'Read outcome failed';end if;checks:=checks+1;
 begin perform jfl.create_season_setup_once(actor,operation,input||'{"configured_purpose":"league"}');raise exception 'Purpose conflict accepted';exception when check_violation then checks:=checks+1;end;
 begin perform jfl.create_season_setup_once(actor,operation,input||'{"configured_first_round_date":"2026-11-10"}');raise exception 'Input conflict accepted';exception when check_violation then checks:=checks+1;end;
 begin perform jfl.create_season_setup_once(other_admin,operation,input);raise exception 'Actor conflict accepted';exception when check_violation then checks:=checks+1;end;
 begin perform jfl.read_season_creation_operation(other_admin,operation);raise exception 'Cross actor read accepted';exception when insufficient_privilege then checks:=checks+1;end;
 begin perform jfl.create_season_setup_once(outsider,operation,input);raise exception 'Nonadmin create accepted';exception when insufficient_privilege then checks:=checks+1;end;
 begin perform jfl.read_season_creation_operation(outsider,operation);raise exception 'Nonadmin read accepted';exception when insufficient_privilege then checks:=checks+1;end;
 begin perform jfl.create_season_setup_once(actor,absent_operation,input||'{"configured_table_numbers":[1,1,2,3]}');raise exception 'Invalid tables accepted' using errcode='ZX002';exception when raise_exception then checks:=checks+1;end;
 begin perform jfl.create_season_setup_once(actor,absent_operation,input||'{"unknown":true}');raise exception 'Unknown input accepted';exception when invalid_parameter_value then checks:=checks+1;end;
 if (select count(*) from jfl.seasons)<>season_count+1 or (select count(*) from jfl_private.audit_events)<>audit_count+1 then raise exception 'Rejected action changed data';end if;checks:=checks+1;
 update jfl.seasons set name='Synthetic later edit' where id=root;
 value:=jfl.create_season_setup_once(actor,operation,input);
 if value->>'created'<>'false' or value->'setup'->>'name'<>'Synthetic later edit' then raise exception 'Later edit was overwritten';end if;checks:=checks+1;
 delete from jfl_private.league_admins where user_id=actor;
 begin perform jfl.read_season_creation_operation(actor,operation);raise exception 'Revoked admin read accepted';exception when insufficient_privilege then checks:=checks+1;end;
 insert into jfl_private.league_admins(user_id) values(actor);
 if has_function_privilege('anon','jfl.create_season_setup_once(uuid,uuid,jsonb)','execute') or has_function_privilege('authenticated','jfl.read_season_creation_operation(uuid,uuid)','execute') or not has_function_privilege('service_role','jfl.read_season_creation_operation(uuid,uuid)','execute') then raise exception 'RPC grants failed';end if;checks:=checks+1;
 if has_table_privilege('service_role','jfl_private.season_creation_operations','INSERT') or not(select relrowsecurity from pg_class where oid='jfl_private.season_creation_operations'::regclass) then raise exception 'Private mapping grants/RLS failed';end if;checks:=checks+1;
 -- A synthetic late failure must roll back the legacy root, audit and outbox.
 alter table jfl_private.season_creation_operations add constraint season_operation_proof_late_failure check(operation_id<>'36520000-5000-4000-8000-000000000092'::uuid);
 begin perform jfl.create_season_setup_once(actor,absent_operation,input);raise exception 'Late constraint failure ignored';exception when check_violation then checks:=checks+1;end;
 if (select count(*) from jfl.seasons)<>season_count+1 or (select count(*) from jfl_private.audit_events)<>audit_count+1 then raise exception 'Late failure leaked writes';end if;checks:=checks+1;
 delete from jfl.seasons where id=root;
 begin perform jfl.read_season_creation_operation(actor,operation);raise exception 'Deleted root read accepted';exception when check_violation then checks:=checks+1;end;
 begin perform jfl.create_season_setup_once(actor,operation,input);raise exception 'Deleted root recreated';exception when check_violation then checks:=checks+1;end;
 proof:=jsonb_build_object('checks',checks,'once_and_actor_input_binding',true,'qa_isolation',true,'authorization',true,'late_failure_atomic',true,'deletion_tombstone',true);
 raise exception 'Roll back protocol and synthetic proof' using errcode='ZX001';
 exception when sqlstate 'ZX001' then null;
 end;
 if ${hashes} is distinct from before_hashes then raise exception 'Original fifteen history hashes were not restored';end if;
 ${mode === '--candidate' ? "if to_regclass('jfl_private.season_creation_operations') is not null then raise exception 'Candidate protocol did not roll back';end if;" : "if (select count(*) from jfl_private.season_creation_operations)<>before_operations then raise exception 'Applied operation rows did not roll back';end if;"}
 insert into pg_temp.season_creation_proof values(proof||jsonb_build_object('rollback_verified',true,'all_fifteen_history_hashes',before_hashes));
end $proof$;
select result from pg_temp.season_creation_proof;
`);
