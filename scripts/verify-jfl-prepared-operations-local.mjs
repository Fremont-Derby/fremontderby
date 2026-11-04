import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href);
const db=new PGlite();
const actor='36490000-0000-4000-8000-000000000001',other='36490000-0000-4000-8000-000000000002',outsider='36490000-0000-4000-8000-000000000003';
const season='36490000-1000-4000-8000-000000000001',otherSeason='36490000-1000-4000-8000-000000000002';
const op='36490000-5000-4000-8000-000000000001',op2='36490000-5000-4000-8000-000000000002';
let checks=0;
const check=name=>{checks++;console.log('PASS local-only: '+name);};
async function counts(){return(await db.query('select (select count(*)::int from jfl.teams) teams,(select count(*)::int from jfl_private.audit_events) audits,(select count(*)::int from jfl_private.prepared_team_creation_operations) operations')).rows[0];}
async function create(a=actor,s=season,name='Prepared team',key=op){return(await db.query('select * from jfl.admin_create_prepared_team_once($1::uuid,$2::uuid,$3,$4::uuid)',[a,s,name,key])).rows;}
try{
 await db.exec((await readFile(new URL('../test/fixtures/jfl-prepared-operation-schema.sql',import.meta.url),'utf8')).replace(/\r\n/g,'\n'));
 await db.exec(`insert into auth.users values('${actor}'),('${other}'),('${outsider}');insert into jfl_private.league_admins values('${actor}'),('${other}');insert into jfl.seasons values('${season}','registration'),('${otherSeason}','registration');grant usage on schema jfl to anon,authenticated,service_role;`);
 const migration=await readFile(new URL('../supabase/migrations/20261027054047_jfl_prepared_team_operation_ids.sql',import.meta.url),'utf8');
 await db.exec(migration);
 const result=await create();assert.equal(result.length,1);assert.deepEqual(await counts(),{teams:1,audits:1,operations:1});check('one creation produces one team, audit and operation');
 const read=async(a=actor,s=season,key=op)=>(await db.query('select * from jfl.admin_read_prepared_team_operation($1::uuid,$2::uuid,$3::uuid)',[a,s,key])).rows;
 assert.deepEqual(await read(),[{...result[0],requested_name:'Prepared team'}]);assert.deepEqual(await counts(),{teams:1,audits:1,operations:1});check('lookup confirms only its owned result without writing');
 assert.deepEqual(await read(actor,season,op2),[]);check('unknown operation returns no result without creation');
 for(const[a,s]of[[other,season],[actor,otherSeason]])await assert.rejects(read(a,s),/not authorized/);await assert.rejects(read(outsider),/not a league admin/);check('lookup rejects other actor, season and nonadmin');
 await assert.rejects(read(actor,season,null),/valid operation/);await assert.rejects(read(actor,season,'00000000-0000-0000-0000-000000000000'),/valid operation/);check('lookup rejects absent and nil identities');
 const readGrants=(await db.query("select has_function_privilege('anon','jfl.admin_read_prepared_team_operation(uuid,uuid,uuid)','EXECUTE') anon_execute,has_function_privilege('authenticated','jfl.admin_read_prepared_team_operation(uuid,uuid,uuid)','EXECUTE') auth_execute,has_function_privilege('service_role','jfl.admin_read_prepared_team_operation(uuid,uuid,uuid)','EXECUTE') service_execute")).rows[0];assert.deepEqual(readGrants,{anon_execute:false,auth_execute:false,service_execute:true});check('lookup is service RPC only, never a browser database grant');
 assert.deepEqual(await create(actor,season,'  Prepared team  '),result);assert.deepEqual(await counts(),{teams:1,audits:1,operations:1});check('equivalent trimmed request returns the same result without an extra audit');
 for(const [a,s,name]of[[other,season,'Prepared team'],[actor,otherSeason,'Prepared team'],[actor,season,'Different intent']])await assert.rejects(create(a,s,name),/does not match/);
 check('actor, season and name collisions reject without leaking another result');
 await assert.rejects(create(outsider),/not a league admin/);check('nonadmin rejected before result disclosure');
 await assert.rejects(create(actor,season,'Prepared team',null),/valid operation/);check('missing operation rejected');
 await assert.rejects(create(actor,season,'Prepared team','00000000-0000-0000-0000-000000000000'),/valid operation/);check('nil operation rejected');
 await assert.rejects(create(actor,season,'Prepared team',op2),/already exists/);check('different intent preserves the original global-name guard');
 await db.exec(`delete from jfl_private.league_admins where user_id='${actor}'`);await assert.rejects(create(),/not a league admin/);await db.exec(`insert into jfl_private.league_admins values('${actor}')`);check('revoked admin cannot recover a previous result');
 await db.exec(`update jfl.seasons set status='active' where id='${season}'`);assert.deepEqual(await create(),result);await assert.rejects(create(actor,season,'New team',op2),/before season publication/);check('published season permits readback of completed operation but no new creation');
 await db.exec(`update jfl.seasons set status='registration' where id='${season}';alter table jfl_private.prepared_team_creation_operations add constraint reject_test_name check(normalized_name <> 'Forced failure')`);
 const before=await counts();await assert.rejects(create(actor,season,'Forced failure',op2),/reject_test_name/);assert.deepEqual(await counts(),before);check('late mapping failure atomically rolls back its team and audit');
 const grants=(await db.query("select has_function_privilege('authenticated','jfl.admin_create_prepared_team_once(uuid,uuid,text,uuid)','EXECUTE') auth_execute,has_function_privilege('service_role','jfl.admin_create_prepared_team_once(uuid,uuid,text,uuid)','EXECUTE') service_execute,has_table_privilege('service_role','jfl_private.prepared_team_creation_operations','INSERT') direct_insert,(select relrowsecurity from pg_class where oid='jfl_private.prepared_team_creation_operations'::regclass) rls")).rows[0];
 assert.deepEqual(grants,{auth_execute:false,service_execute:true,direct_insert:false,rls:true});check('only the guarded service RPC can write the private RLS operation table');
 await assert.rejects(db.exec(migration),/already exists/);await db.exec('rollback');assert.deepEqual(await counts(),before);check('reapplication fails closed without changing history');
 await db.exec(`delete from jfl.teams where id='${result[0].id}'`);await assert.rejects(create(),/no longer available/);await assert.rejects(read(),/no longer available/);assert.deepEqual(await counts(),{teams:0,audits:1,operations:1});check('deleted result cannot recreate a team or return a stale lookup');
 console.log(`PASS ${checks} local PostgreSQL cases; sequential replay only, no hosted or real concurrency acceptance.`);
}catch(error){console.error('FAIL local-only: '+error.message+'\n'+(error.where||'')+'\n'+(error.internalQuery||''));process.exitCode=1;}
finally{await db.close();}
