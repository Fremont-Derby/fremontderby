// Disposable LOCAL PostgreSQL only. Real eight RPC bodies, minimal relations;
// Membership/eligibility are test doubles, not hosted acceptance.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Client } = require(process.env.PG_MODULE_PATH || 'pg');
const port = Number(process.env.OWNERSHIP_TEST_PORT);
assert.ok(port >= 55000 && port <= 55999, 'Explicit disposable local port required');
const config = { host: '127.0.0.1', port, user: 'postgres', database: 'postgres' };
const admin = new Client(config);
await admin.connect();
config.database = `ownership_${process.pid}_${Date.now()}`;
await admin.query(`create database ${config.database}`);
const db = new Client(config);
await db.connect();
const baseline = JSON.parse(await readFile(new URL('../test/fixtures/jfl-ordinary-score-baseline.json', import.meta.url)));
const candidate = await readFile(new URL('./sql/jfl-ordinary-score-ownership.candidate.sql', import.meta.url), 'utf8');
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const match=id(1), team=id(2), owner=id(3), stale=id(4), tracker=id(5);
let passes=0;
const query = (sql, params) => db.query(sql, params);
const calls = baseline.map(({ proname }) => {
  const args=[owner,match,team];
  if (proname.startsWith('update')) args.push(1);
  if (/^(record|update)/.test(proname)) args.push(proname.startsWith('update') ? 'B' : 'A');
  if (proname.endsWith('_checked')) args.push(JSON.stringify([{rackNumber:1,discipline:'8-ball',winnerSide:'A'}]));
  return { name:proname, args, sql:`select * from jfl.${proname}(${args.map((_,i)=>`$${i+1}`).join(',')})` };
});
try {
  assert.equal((await query("select count(*)::int n from pg_namespace where nspname in ('jfl','jfl_private')")).rows[0].n,0,'Refuse existing JFL schema');
  for (const role of ['anon','authenticated','service_role']) {
    if (!(await query('select 1 from pg_roles where rolname=$1',[role])).rowCount) await query(`create role ${role}`);
  }
  await query(`
    create schema jfl; create schema jfl_private;
    create table jfl.player_matches(id uuid primary key,season_id uuid,status text,race_to_a int,race_to_b int,opening_block_length int,opening_discipline text);
    create table jfl_private.player_match_score_claims(player_match_id uuid,scoring_team_id uuid,owner_user_id uuid,claimed_at timestamptz,pending_requester_user_id uuid,pending_requested_at timestamptz,pending_expires_at timestamptz,last_transition_at timestamptz,primary key(player_match_id,scoring_team_id));
    create table jfl_private.player_match_score_submissions(id uuid default gen_random_uuid(),season_id uuid,player_match_id uuid,tracker_player_id uuid,racks jsonb,confirmed_at timestamptz,updated_at timestamptz,
      constraint player_match_score_submission_player_match_id_tracker_playe_key unique(player_match_id,tracker_player_id));
    create table jfl_private.audit_events(actor_user_id uuid,action text,entity_type text,entity_id uuid,reason text,before_state jsonb,after_state jsonb);
    create function jfl_private.match_tracker_for_scoring_team(actor_user_id uuid,target_match jfl.player_matches,target_scoring_team_id uuid) returns uuid language plpgsql as $$ begin
      if target_scoring_team_id <> '${team}' or actor_user_id is null or actor_user_id not in ('${owner}','${stale}') then raise exception 'Not eligible'; end if;
      return '${tracker}'::uuid; end; $$;
    create function jfl_private.require_score_claim_actor(actor_user_id uuid,target_match jfl.player_matches,target_scoring_team_id uuid) returns uuid language sql as $$ select jfl_private.match_tracker_for_scoring_team(actor_user_id,target_match,target_scoring_team_id) $$;
    create function jfl_private.score_claim_actor_is_eligible(actor_user_id uuid,target_match jfl.player_matches,target_scoring_team_id uuid) returns boolean language plpgsql as $$ begin
      perform jfl_private.require_score_claim_actor(actor_user_id,target_match,target_scoring_team_id); return true;
      exception when raise_exception then return false; end; $$;
    create function jfl_private.assert_expected_score_history(target_player_match_id uuid,target_tracker_id uuid,expected_racks jsonb) returns void language plpgsql as $$ begin
      if (select racks from jfl_private.player_match_score_submissions where player_match_id=target_player_match_id and tracker_player_id=target_tracker_id) is distinct from expected_racks then raise exception 'History changed'; end if; end; $$;`);
  const resolver=await readFile(new URL('../test/fixtures/jfl-score-takeover-resolver.sql',import.meta.url),'utf8');
  await query(resolver.slice(resolver.indexOf('create or replace function')));
  for (const row of baseline) {
    await query(row.definition);
    const signature=row.definition.match(/FUNCTION ([^(]+\([^\n]+\))/)[1];
    await query(`revoke all on function ${signature} from public,anon,authenticated; grant execute on function ${signature} to service_role`);
  }
  await query('insert into jfl.player_matches values($1,$2,\'playing\',1,1,2,\'8-ball\')',[match,id(9)]);
  const reset = async () => {
    await query('truncate jfl_private.player_match_score_claims,jfl_private.player_match_score_submissions,jfl_private.audit_events');
    await query("insert into jfl_private.player_match_score_submissions(season_id,player_match_id,tracker_player_id,racks) values($1,$2,$3,$4)",[id(9),match,tracker,JSON.stringify([{rackNumber:1,discipline:'8-ball',winnerSide:'A'}])]);
  };
  // Negative control: former owner can edit the qualified baseline.
  await reset();
  const edit=calls.find(c=>c.name==='update_player_match_score_rack');
  await query(edit.sql,[stale,match,team,1,'B']);
  assert.equal((await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks[0].winnerSide,'B'); passes++;
  await query('begin'); await query(candidate); await query('commit');
  // A repeat must refuse atomically rather than patch already-modified bodies.
  await query('begin'); await assert.rejects(query(candidate),/Unqualified/); await query('rollback'); passes++;
  for (const call of calls) {
    for (const mode of ['absent','null','former','opposite','ineligible']) {
      await reset();
      if(mode!=='absent') await query('insert into jfl_private.player_match_score_claims values($1,$2,$3)',[match,team,mode==='null'?null:owner]);
      const args=[...call.args]; args[0]=mode==='ineligible'?id(99):stale; if(mode==='opposite')args[2]=id(88);
      const before=(await query('select row_to_json(s) v from jfl_private.player_match_score_submissions s')).rows;
      await assert.rejects(query(call.sql,args),/current scorekeeper|Not eligible/);
      assert.deepEqual((await query('select row_to_json(s) v from jfl_private.player_match_score_submissions s')).rows,before);
      assert.equal((await query('select count(*)::int n from jfl_private.audit_events')).rows[0].n,0); passes++;
    }
    await reset();
    await query('insert into jfl_private.player_match_score_claims values($1,$2,$3)',[match,team,owner]);
    if(call.name.startsWith('record')) {
      await query('update jfl_private.player_match_score_submissions set racks=\'[]\'');
      if(call.name.endsWith('_checked'))call.args[call.args.length-1]='[]';
    }
    const result=await query(call.sql,call.args);
    assert.equal(result.rows[0].tracker_player_id,tracker);
    assert.equal((await query('select actor_user_id from jfl_private.audit_events')).rows[0].actor_user_id,owner); passes++;
  }
  const checked=calls.find(c=>c.name==='update_player_match_score_rack_checked');
  await reset(); await query('insert into jfl_private.player_match_score_claims values($1,$2,$3)',[match,team,owner]);
  await assert.rejects(query(checked.sql,[owner,match,team,1,'B','[]']),/History changed/); passes++;
  // Transfer commits while holding match lock; stale writer must actually wait,
  // then see the new owner even with identical expected history.
  const transfer=new Client(config), writer=new Client(config);
  await transfer.connect(); await writer.connect();
  try {
    await transfer.query('begin'); await transfer.query('select * from jfl.player_matches where id=$1 for update',[match]);
    await transfer.query('update jfl_private.player_match_score_claims set owner_user_id=$1',[stale]);
    const pid=(await writer.query('select pg_backend_pid() pid')).rows[0].pid;
    const writing=writer.query(checked.sql,checked.args).then(()=>({ok:true}),error=>({error}));
    let waiting=false;
    for(let i=0;i<100;i++) {
      if((await query("select wait_event_type from pg_stat_activity where pid=$1",[pid])).rows[0].wait_event_type==='Lock'){ waiting=true; break; }
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    assert.ok(waiting,'Writer must wait on held match lock');
    await transfer.query('commit');
    assert.match((await writing).error?.message || '',/current scorekeeper/); passes++;
  } finally { await transfer.query('rollback'); await transfer.end(); await writer.end(); }
  // Actual qualified resolver: pending requester denied; expired requester wins;
  // rejected former-owner write rolls lazy expiry back along with score changes.
  for(const expired of [false,true]) {
    await reset();
    await query(`insert into jfl_private.player_match_score_claims(player_match_id,scoring_team_id,owner_user_id,pending_requester_user_id,pending_expires_at) values($1,$2,$3,$4,now()+$5::interval)`,[match,team,owner,stale,expired?'-1 second':'15 seconds']);
    await assert.rejects(query(checked.sql,[expired?owner:stale,match,team,1,'B',checked.args.at(-1)]),/current scorekeeper/);
    assert.equal((await query('select owner_user_id from jfl_private.player_match_score_claims')).rows[0].owner_user_id,owner);
    if(expired) {
      await query(checked.sql,[stale,match,team,1,'B',checked.args.at(-1)]);
      assert.equal((await query('select owner_user_id from jfl_private.player_match_score_claims')).rows[0].owner_user_id,stale);
    }
    passes++;
  }
  console.log(`${passes} native PostgreSQL cases PASS; actual eight RPCs + expiry resolver; eligibility is an isolated double; no hosted acceptance`);
} finally {
  await db.end();
  await admin.query(`drop database ${config.database}`);
  await admin.end();
}
