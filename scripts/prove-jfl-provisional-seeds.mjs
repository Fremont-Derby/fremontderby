// #3340: emit rollback-only proof SQL; execute only through the qualified JFL route.
// --candidate includes the guarded repository migration in a rolled-back subtransaction.
// --applied exercises the applied functions; synthetic QA writes always roll back.
import { readFileSync } from 'node:fs';
const mode = process.argv[2];
if (!['--candidate', '--applied'].includes(mode)) throw new Error('Use --candidate or --applied');
const candidate = mode === '--candidate' ? readFileSync(new URL('../supabase/migrations/20261006045528_jfl_audited_provisional_seeds.sql', import.meta.url), 'utf8') : '';
let sql = String.raw`

create temporary table seed_candidate_proof(proof jsonb) on commit drop;
do $proof$ declare target uuid; admin_actor uuid := 'b22805b6-92ba-44bd-a92e-0c82f0be6613'; nonadmin uuid; before_seed jsonb; before_matches text; result jsonb; first_event text; checks integer := 0; proof jsonb; baseline_events integer; before_pointer jsonb;
begin
select p.id into strict target from jfl.players p join jfl.season_players sp on sp.player_id=p.id join jfl.player_ratings r on r.player_id=p.id where sp.season_id='18580000-1000-4000-8000-000000000000' and r.rating_status='provisional' and exists(select 1 from jfl.seasons s where s.id=sp.season_id and s.purpose='qa') order by p.id limit 1;
select u.id into strict nonadmin from auth.users u where not exists(select 1 from jfl_private.league_admins a where a.user_id=u.id) order by u.id limit 1;
select to_jsonb(r) into before_seed from jfl.player_ratings r where player_id=target;
select md5(string_agg(to_jsonb(pm)::text,'' order by id)) into before_matches from jfl.player_matches pm;
begin
execute $candidate$CANDIDATE_SQL$candidate$;
select count(*) into baseline_events from jfl_private.admin_provisional_seed_events where player_id=target;
select to_jsonb(c) into before_pointer from jfl_private.current_admin_provisional_seeds c where player_id=target;
result := jfl.get_admin_provisional_seed(admin_actor,target);
if baseline_events=0 and result->>'source'<>'unverified_legacy' then raise exception 'Legacy value mislabeled'; end if; checks:=checks+1;
begin perform jfl.record_admin_provisional_seed(nonadmin,target,501,'Synthetic rollback test'); raise exception 'Nonadmin accepted'; exception when insufficient_privilege then checks:=checks+1; end;
begin perform jfl.get_admin_provisional_seed(nonadmin,target); raise exception 'Nonadmin read accepted'; exception when insufficient_privilege then checks:=checks+1; end;
begin perform jfl.record_admin_provisional_seed(admin_actor,target,null,'Synthetic rollback test'); raise exception 'Null accepted'; exception when invalid_parameter_value then checks:=checks+1; end;
begin perform jfl.record_admin_provisional_seed(admin_actor,target,-1,'Synthetic rollback test'); raise exception 'Negative accepted'; exception when invalid_parameter_value then checks:=checks+1; end;
begin perform jfl.record_admin_provisional_seed(admin_actor,target,1001,'Synthetic rollback test'); raise exception 'Out of bounds accepted'; exception when invalid_parameter_value then checks:=checks+1; end;
begin perform jfl.record_admin_provisional_seed(admin_actor,target,501,'   '); raise exception 'Empty reason accepted'; exception when invalid_parameter_value then checks:=checks+1; end;
begin perform jfl.record_admin_provisional_seed(admin_actor,target,501,repeat('x',501)); raise exception 'Long reason accepted'; exception when invalid_parameter_value then checks:=checks+1; end;
begin perform jfl.record_admin_provisional_seed(admin_actor,'00000000-0000-4000-8000-000000000000',500,'Synthetic missing-player test'); raise exception 'Missing player accepted'; exception when no_data_found then checks:=checks+1; end;
result := jfl.record_admin_provisional_seed(admin_actor,target,0,'Synthetic QA rollback lower boundary');
if result->>'source'<>'admin_provisional' or (result->>'ratingValue')::integer<>0 or result->>'eventId' is null or result->>'effectiveAt' is null then raise exception 'Valid lower boundary not confirmed'; end if; first_event:=result->>'eventId'; checks:=checks+1;
result := jfl.record_admin_provisional_seed(admin_actor,target,1000,'Synthetic QA rollback upper boundary');
if result->>'source'<>'admin_provisional' or (result->>'ratingValue')::integer<>1000 or result->>'eventId'=first_event or (select count(*) from jfl_private.admin_provisional_seed_events where player_id=target)<>baseline_events+2 then raise exception 'Append/upper boundary failed'; end if; checks:=checks+1;
if not exists(select 1 from jfl_private.admin_provisional_seed_events where id=first_event::uuid and actor_user_id=admin_actor and previous_value=(before_seed->>'fargo_rating')::integer and reason='Synthetic QA rollback lower boundary') then raise exception 'Provenance failed'; end if; checks:=checks+1;
update jfl.player_ratings set rating_status='established' where player_id=target;
result := jfl.get_admin_provisional_seed(admin_actor,target); if result->>'source'<>'unverified_legacy' or result->>'eventId' is not null then raise exception 'Established source mislabeled'; end if; checks:=checks+1;
begin perform jfl.record_admin_provisional_seed(admin_actor,target,500,'Synthetic QA rollback protected seed'); raise exception 'Established overwritten'; exception when check_violation then checks:=checks+1; end;
if has_function_privilege('anon','jfl.record_admin_provisional_seed(uuid,uuid,integer,text)','execute') or has_function_privilege('authenticated','jfl.record_admin_provisional_seed(uuid,uuid,integer,text)','execute') or has_function_privilege('authenticated','jfl.get_admin_provisional_seed(uuid,uuid)','execute') then raise exception 'Browser RPC grant'; end if; checks:=checks+1;
if has_table_privilege('service_role','jfl_private.admin_provisional_seed_events','update') or has_table_privilege('service_role','jfl_private.admin_provisional_seed_events','delete') or has_table_privilege('authenticated','jfl_private.admin_provisional_seed_events','select') or not (select relrowsecurity from pg_class where oid='jfl_private.admin_provisional_seed_events'::regclass) then raise exception 'Immutable private provenance boundary failed'; end if; checks:=checks+1;
delete from jfl.player_ratings where player_id=target;
result:=jfl.get_admin_provisional_seed(admin_actor,target); if result->>'source'<>'missing' or result->>'ratingValue' is not null then raise exception 'Missing source mislabeled'; end if; checks:=checks+1;
result:=jfl.record_admin_provisional_seed(admin_actor,target,500,'Synthetic QA rollback explicit missing seed'); if result->>'source'<>'admin_provisional' or not exists(select 1 from jfl_private.admin_provisional_seed_events where id=(result->>'eventId')::uuid and previous_value is null) then raise exception 'Explicit missing seed failed'; end if; checks:=checks+1;
if (select md5(string_agg(to_jsonb(pm)::text,'' order by id)) from jfl.player_matches pm)<>before_matches then raise exception 'Historical match changed'; end if; checks:=checks+1;
proof:=jsonb_build_object('checks',checks,'admin_append_and_boundaries',true,'nonadmin_and_browser_denial',true,'private_immutable_provenance',true,'historical_match_hash',before_matches);
raise exception 'Rollback candidate and synthetic writes' using errcode='ZX001';
exception when sqlstate 'ZX001' then null;
end;
if to_regclass('jfl_private.admin_provisional_seed_events') is not null or to_regprocedure('jfl.record_admin_provisional_seed(uuid,uuid,integer,text)') is not null then raise exception 'Candidate schema did not roll back'; end if;
if (select to_jsonb(r) from jfl.player_ratings r where player_id=target)<>before_seed then raise exception 'QA seed did not roll back'; end if;
if to_regclass('jfl_private.current_admin_provisional_seeds') is not null then
 if (select to_jsonb(c) from jfl_private.current_admin_provisional_seeds c where player_id=target) is distinct from before_pointer or (select count(*) from jfl_private.admin_provisional_seed_events where player_id=target)<>baseline_events then raise exception 'Provenance did not roll back'; end if;
end if;
insert into pg_temp.seed_candidate_proof values(proof||jsonb_build_object('rollback_verified',true));
end $proof$;
select proof from pg_temp.seed_candidate_proof;
`;
sql = sql.replace('execute $candidate$CANDIDATE_SQL$candidate$;', candidate ? 'execute $candidate$' + candidate + '$candidate$;' : '');
if (mode === '--applied') sql = sql.replace("if to_regclass('jfl_private.admin_provisional_seed_events') is not null or to_regprocedure('jfl.record_admin_provisional_seed(uuid,uuid,integer,text)') is not null then raise exception 'Candidate schema did not roll back'; end if;", "if to_regclass('jfl_private.admin_provisional_seed_events') is null or to_regprocedure('jfl.record_admin_provisional_seed(uuid,uuid,integer,text)') is null then raise exception 'Applied schema missing'; end if;");
process.stdout.write(sql);
