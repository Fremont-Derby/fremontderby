// Disposable local native PostgreSQL only. Never accepts a hosted connection URL.
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const [runtimeRoot,dataDirectory]=process.argv.slice(2);
if(!runtimeRoot||!dataDirectory)throw new Error('Provide scratch runtime and new disposable database directory');
const {default:pg}=await import(pathToFileURL(path.join(runtimeRoot,'node_modules/pg/lib/index.js')).href);
const {Client}=pg;
const binaries=await import(pathToFileURL(path.join(runtimeRoot,'node_modules/@embedded-postgres/windows-x64/dist/index.js')).href);
const port=55469;
const config={host:'127.0.0.1',port,user:'local_fixture',database:'postgres',connectionTimeoutMillis:3000};
function run(exe,args){const result=spawnSync(exe,args,{windowsHide:true,encoding:'utf8',timeout:30_000});if(result.status!==0)throw new Error(path.basename(exe)+' failed: '+(result.stderr||result.stdout));}
const clients=[];let started=false;
async function connect(){const client=new Client(config);await client.connect();clients.push(client);return client;}
const actor='36490000-0000-4000-8000-000000000001',other='36490000-0000-4000-8000-000000000002';
const season='36490000-1000-4000-8000-000000000001';
const op=i=>'36490000-5000-4000-8000-'+String(i).padStart(12,'0');
const sql='select * from jfl.admin_create_prepared_team_once($1::uuid,$2::uuid,$3,$4::uuid)';
try{
 await mkdir(dataDirectory,{recursive:false});
 run(binaries.initdb,['-D',dataDirectory,'-U','local_fixture','--auth=trust','--no-locale','-E','UTF8']);
 run(binaries.pg_ctl,['-D',dataDirectory,'-l',path.join(dataDirectory,'server.log'),'-w','start','-o','-h 127.0.0.1 -p '+port]);started=true;
 const observer=await connect(),a=await connect(),b=await connect();
 await observer.query((await readFile(new URL('../test/fixtures/jfl-prepared-operation-schema.sql',import.meta.url),'utf8')).replace(/\r\n/g,'\n'));
 await observer.query(`insert into auth.users values('${actor}'),('${other}');insert into jfl_private.league_admins values('${actor}'),('${other}');insert into jfl.seasons values('${season}','registration');`);
 await observer.query(await readFile(new URL('../supabase/migrations/20261027054047_jfl_prepared_team_operation_ids.sql',import.meta.url),'utf8'));
 const pid=(await b.query('select pg_backend_pid() pid')).rows[0].pid;
 async function blocked(){const end=Date.now()+4000;while(Date.now()<end){const result=await observer.query("select exists(select 1 from pg_locks where pid=$1 and locktype='advisory' and not granted) blocked",[pid]);if(result.rows[0].blocked)return;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('Second connection did not wait on the operation lock');}
 for(const [i,conflict,rollback]of[[1,false,false],[2,true,false],[3,false,true]]){
  const name='Concurrent team '+i;
  await a.query('begin');const first=(await a.query(sql,[actor,season,name,op(i)])).rows;
  const pending=b.query(sql,[conflict?other:actor,season,name,op(i)]).then(value=>({value}),error=>({error}));
  await blocked();
  assert.equal((await observer.query('select count(*)::int count from jfl_private.prepared_team_creation_operations where operation_id=$1',[op(i)])).rows[0].count,0);
  await a.query(rollback?'rollback':'commit');
  const outcome=await pending;
  if(conflict){assert.equal(outcome.error?.code,'23514');}
  else{assert.equal(outcome.error,undefined);if(!rollback)assert.deepEqual(outcome.value.rows,first);}
  const counts=(await observer.query('select (select count(*)::int from jfl.teams where name=$1) teams,(select count(*)::int from jfl_private.audit_events where after_state->>\'teamName\'=$1) audits,(select count(*)::int from jfl_private.prepared_team_creation_operations where operation_id=$2) operations',[name,op(i)])).rows[0];
  assert.deepEqual(counts,{teams:1,audits:1,operations:1});
  console.log('PASS native concurrent: '+(conflict?'different actor rejected after actual lock wait':rollback?'rolled-back leader permits one follower creation':'equivalent follower returns the exact committed team'));
 }
 const totals=(await observer.query('select (select count(*)::int from jfl.teams) teams,(select count(*)::int from jfl_private.audit_events) audits,(select count(*)::int from jfl_private.prepared_team_creation_operations) operations')).rows[0];
 assert.deepEqual(totals,{teams:3,audits:3,operations:3});
 console.log('PASS native PostgreSQL '+(await observer.query('show server_version')).rows[0].server_version+': three concurrent cases, three teams, three audits, three operation records; no hosted writes');
}finally{
 for(const client of clients)await client.end().catch(()=>{});
 if(started)run(binaries.pg_ctl,['-D',dataDirectory,'-w','stop','-m','fast']);
}
