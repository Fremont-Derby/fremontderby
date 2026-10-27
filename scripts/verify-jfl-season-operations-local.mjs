import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const runtime=await import(pathToFileURL(process.argv[2]).href);
const Client=runtime.Client||runtime.default?.Client;
const nativeUrl=process.env.JFL_LOCAL_TEST_DATABASE_URL;
let db;
if(nativeUrl){
 if(!['127.0.0.1','localhost','[::1]'].includes(new URL(nativeUrl).hostname))throw new Error('Only an owned local disposable database is allowed');
 const client=new Client({connectionString:nativeUrl});await client.connect();
 db={query:(sql,args)=>client.query(sql,args),exec:sql=>client.query(sql),close:()=>client.end()};
}else db=new runtime.PGlite();
let checks=0;
const actor='36520000-0000-4000-8000-000000000001',other='36520000-0000-4000-8000-000000000002',outsider='36520000-0000-4000-8000-000000000003';
const op='36520000-5000-4000-8000-000000000001',op2='36520000-5000-4000-8000-000000000002';
const input={configured_season_name:'Operation season',configured_league_night:'Tuesday',configured_first_round_date:'2026-11-03',configured_roster_lock_round:3,configured_opening_block_length:3,configured_individual_min_matches:5,configured_round_interval_days:7,configured_table_numbers:[1,2,3,4],configured_race_chart_version:'season-1-default',configured_playoff_team_count:4,configured_playoff_anchor_tiebreaker:true,configured_purpose:'qa'};
const check=name=>{checks++;console.log('PASS local-only: '+name);};
async function create(a=actor,key=op,body=input){return(await db.query('select jfl.create_season_setup_once($1::uuid,$2::uuid,$3::jsonb) result',[a,key,JSON.stringify(body)])).rows[0].result;}
async function read(a=actor,key=op){return(await db.query('select jfl.read_season_creation_operation($1::uuid,$2::uuid) result',[a,key])).rows[0].result;}
async function counts(){return(await db.query('select (select count(*)::int from jfl.seasons) seasons,(select count(*)::int from jfl_private.audit_events) audits,(select count(*)::int from jfl_private.season_creation_operations) operations')).rows[0];}
try{
 await db.exec((await readFile(new URL('../test/fixtures/jfl-season-operation-schema.sql',import.meta.url),'utf8')).replace(/\r\n/g,'\n'));
 await db.exec(`insert into auth.users values('${actor}'),('${other}'),('${outsider}');insert into jfl_private.league_admins values('${actor}'),('${other}');`);
 const migration=await readFile(new URL('../supabase/migrations/20261027111402_jfl_season_creation_operation_ids.sql',import.meta.url),'utf8');
 await db.exec(migration);
 const first=await create();assert.equal(first.created,true);assert.match(first.setup.id,/^[0-9a-f-]{36}$/);assert.deepEqual(await counts(),{seasons:1,audits:1,operations:1});check('one intent creates one distinct root with the legacy audit');
 const again=await create(actor,op,{...input,configured_season_name:'  Operation season  '});assert.equal(again.created,false);assert.equal(again.setup.id,first.setup.id);assert.deepEqual(await counts(),{seasons:1,audits:1,operations:1});check('equivalent canonical request acknowledges without another root or audit');
 const lookup=await read();assert.equal(lookup.setup.id,first.setup.id);assert.deepEqual(lookup.requestedInput,input);assert.equal(await read(actor,op2),null);check('owned lookup and absent lookup are read-only');
 for(const body of[{...input,configured_purpose:'league'},{...input,configured_first_round_date:'2026-11-10'},{...input,configured_table_numbers:[4,3,2,1]},{...input,configured_playoff_anchor_tiebreaker:false}])await assert.rejects(create(actor,op,body),/does not match/);check('purpose, date, table order and tiebreak changes cannot reuse an intent');
 await assert.rejects(create(other),/does not match/);await assert.rejects(read(other),/not authorized/);check('another admin cannot reuse or inspect the intent');
 await assert.rejects(create(outsider),/not a league admin/);await assert.rejects(read(outsider),/not a league admin/);check('nonadmin denied before result disclosure');
 for(const key of[null,'00000000-0000-0000-0000-000000000000']){await assert.rejects(create(actor,key),/non-nil/);await assert.rejects(read(actor,key),/non-nil/);}check('missing and nil operation identities rejected');
 const before=await counts();for(const body of[{...input,configured_roster_lock_round:0},{...input,configured_table_numbers:[1,1,2,3]},{...input,configured_purpose:'invalid'},{...input,configured_first_round_date:null}])await assert.rejects(create(actor,op2,body));assert.deepEqual(await counts(),before);check('existing validator rejects invalid drafts and rolls back preliminary root insertion');
 await assert.rejects(create(actor,op2,{...input,unexpected:true}),/Exact season creation fields/);const missing={...input};delete missing.configured_purpose;await assert.rejects(create(actor,op2,missing),/Exact season creation fields/);check('unknown and missing fields fail closed');
 await db.exec(`alter table jfl_private.season_creation_operations add constraint reject_late_name check(requested_input->>'configured_season_name'<>'Late failure')`);await assert.rejects(create(actor,op2,{...input,configured_season_name:'Late failure'}),/reject_late_name/);assert.deepEqual(await counts(),before);check('late operation insert failure atomically rolls back root and audit');
 await db.exec(`update jfl.seasons set name='Later edit',status='active' where id='${first.setup.id}'`);const current=await create();assert.equal(current.created,false);assert.equal(current.setup.name,'Later edit');assert.equal(current.setup.status,'active');assert.equal((await read()).setup.name,'Later edit');assert.deepEqual(await counts(),before);check('acknowledgment reads current edited/published state without overwriting it');
 await db.exec(`delete from jfl_private.league_admins where user_id='${actor}'`);await assert.rejects(read(),/not a league admin/);await assert.rejects(create(),/not a league admin/);await db.exec(`insert into jfl_private.league_admins values('${actor}')`);check('revoked admin cannot recover a prior result');
 const grants=(await db.query("select has_function_privilege('authenticated','jfl.create_season_setup_once(uuid,uuid,jsonb)','execute') auth_create,has_function_privilege('anon','jfl.read_season_creation_operation(uuid,uuid)','execute') anon_read,has_function_privilege('service_role','jfl.read_season_creation_operation(uuid,uuid)','execute') service_read,has_table_privilege('service_role','jfl_private.season_creation_operations','INSERT') direct_insert,(select relrowsecurity from pg_class where oid='jfl_private.season_creation_operations'::regclass) rls")).rows[0];assert.deepEqual(grants,{auth_create:false,anon_read:false,service_read:true,direct_insert:false,rls:true});check('private RLS store with service-only guarded functions');
 await assert.rejects(db.exec(migration),/already exists/);await db.exec('rollback');assert.deepEqual(await counts(),before);check('reapplication fails closed without data changes');
 await db.exec(`delete from jfl.seasons where id='${first.setup.id}'`);await assert.rejects(read(),/no longer available/);await assert.rejects(create(),/no longer available/);check('deleted season leaves a tombstone rather than permitting recreation');
 if(nativeUrl){
  const a=new Client({connectionString:nativeUrl});const b=new Client({connectionString:nativeUrl});await a.connect();await b.connect();
  try{
   for(const mode of ['equivalent','conflicting','rollback']){
    const key=mode==='equivalent'?op2:mode==='conflicting'?'36520000-5000-4000-8000-000000000003':'36520000-5000-4000-8000-000000000004';
    const prior=await counts();await a.query('begin');
    const first=(await a.query('select jfl.create_season_setup_once($1,$2,$3) result',[actor,key,JSON.stringify(input)])).rows[0].result;
    const pid=(await b.query('select pg_backend_pid() pid')).rows[0].pid;
    const second=b.query('select jfl.create_season_setup_once($1,$2,$3) result',[actor,key,JSON.stringify(mode==='conflicting'?{...input,configured_purpose:'league'}:input)]).then(value=>({value}),error=>({error}));
    let blocked=false;for(let attempt=0;attempt<50;attempt++){
     const row=(await db.query("select wait_event from pg_stat_activity where pid=$1",[pid])).rows[0];
     if(row?.wait_event==='advisory'){blocked=true;break}await new Promise(resolve=>setTimeout(resolve,20));
    }
    assert.equal(blocked,true,'second native session must wait on the operation lock');
    await a.query(mode==='rollback'?'rollback':'commit');const result=await second;
    if(mode==='conflicting'){assert.equal(result.error?.code,'23514')}else{
     assert.equal(result.error,undefined);assert.equal(result.value.rows[0].result.created,mode==='rollback');
     if(mode==='equivalent')assert.equal(result.value.rows[0].result.setup.id,first.setup.id);
    }
    assert.deepEqual(await counts(),{seasons:prior.seasons+1,audits:prior.audits+1,operations:prior.operations+1});
    check('native concurrent '+mode+' serializes to exactly one root and audit');
   }
  }finally{await a.query('rollback');await a.end();await b.end()}
 }
 console.log(`PASS ${checks} local PostgreSQL cases${nativeUrl?' including real two-session concurrency':''}; no hosted apply or live application acceptance.`);
}catch(error){console.error('FAIL local-only: '+error.message+' '+(error.where||''));process.exitCode=1;}
finally{await db.close();}
