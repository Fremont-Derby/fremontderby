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
  // Preflight must reject ACL drift before installing even the guard.
  await query('begin');
  await query('grant execute on function jfl.confirm_player_match_score(uuid,uuid,uuid) to authenticated');
  await assert.rejects(query(candidate),/EXECUTE permissions/);
  await query('rollback');
  assert.equal((await query("select to_regprocedure('jfl_private.require_current_scorekeeper(uuid,uuid,uuid)') p")).rows[0].p,null); passes++;
  await query('begin');
  await query("alter function jfl.confirm_player_match_score(uuid,uuid,uuid) set search_path='public'");
  await assert.rejects(query(candidate),/Unqualified/);
  await query('rollback'); passes++;
  await query('begin'); await query(candidate); await query('commit');
  for (const role of ['anon','authenticated']) {
    assert.equal((await query("select has_function_privilege($1,'jfl_private.require_current_scorekeeper(uuid,uuid,uuid)','EXECUTE') p",[role])).rows[0].p,false); passes++;
  }
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
  // Reverse ordering: an authorized write commits before transfer gets the lock.
  await reset(); await query('insert into jfl_private.player_match_score_claims values($1,$2,$3)',[match,team,owner]);
  const first=new Client(config), next=new Client(config);
  await first.connect(); await next.connect();
  try {
    await first.query('begin');
    await first.query(checked.sql,checked.args);
    const pid=(await next.query('select pg_backend_pid() pid')).rows[0].pid;
    const transferring=next.query('begin').then(()=>next.query('select * from jfl.player_matches where id=$1 for update',[match]));
    let waiting=false;
    for(let i=0;i<100;i++) {
      if((await query('select wait_event_type from pg_stat_activity where pid=$1',[pid])).rows[0].wait_event_type==='Lock'){waiting=true;break;}
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    assert.ok(waiting,'Transfer must wait behind authorized score transaction');
    await first.query('commit'); await transferring;
    await next.query('update jfl_private.player_match_score_claims set owner_user_id=$1',[stale]);
    await next.query('commit');
    assert.equal((await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks[0].winnerSide,'B');
    await assert.rejects(query(edit.sql,edit.args),/current scorekeeper/); passes++;
  } finally { await first.query('rollback'); await next.query('rollback'); await first.end(); await next.end(); }
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
  // Exercise expiry through EVERY entrypoint, including the checked wrappers.
  // Compare the entire claim/submission/audit state on rejection: checking only
  // the score would miss a transfer or audit event committed by a failed write.
  const snapshot = async () => (await query(`select jsonb_build_object(
    'claims',(select jsonb_agg(to_jsonb(c)) from jfl_private.player_match_score_claims c),
    'scores',(select jsonb_agg(to_jsonb(s)) from jfl_private.player_match_score_submissions s),
    'audit',(select jsonb_agg(to_jsonb(a)) from jfl_private.audit_events a)) state`)).rows[0].state;
  for (const call of calls) {
    for (const mode of ['pending','expired-former','expired-new','expired-ineligible']) {
      await reset();
      const args=[...call.args];
      if(call.name.startsWith('record')) {
        await query("update jfl_private.player_match_score_submissions set racks='[]'");
      }
      if(call.name.endsWith('_checked')) args[args.length-1]=JSON.stringify(
        (await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks);
      const requester=mode==='expired-ineligible'?id(99):stale;
      await query(`insert into jfl_private.player_match_score_claims
        (player_match_id,scoring_team_id,owner_user_id,pending_requester_user_id,pending_requested_at,pending_expires_at)
        values($1,$2,$3,$4,now()-interval '20 seconds',now()+$5::interval)`,
      [match,team,owner,requester,mode==='pending'?'15 seconds':'-1 second']);
      args[0]=mode==='pending'||mode==='expired-new'?stale:owner;
      const before=await snapshot();
      if(mode==='pending'||mode==='expired-former') {
        await assert.rejects(query(call.sql,args),/current scorekeeper/);
        assert.deepEqual(await snapshot(),before);
      } else {
        const result=await query(call.sql,args);
        assert.equal(result.rows[0].tracker_player_id,tracker);
        const state=await snapshot();
        assert.equal(state.claims[0].owner_user_id,mode==='expired-new'?stale:owner);
        assert.equal(state.claims[0].pending_requester_user_id,null);
        assert.equal(state.claims[0].pending_expires_at,null);
        assert.equal(state.audit.length,2,'Exactly one transition and one scoring audit');
        assert.equal(state.audit[0].action,mode==='expired-new'?
          'player_match.scorekeeper_takeover_auto_transfer':'player_match.scorekeeper_takeover_ineligible');
        assert.equal(state.audit[1].actor_user_id,args[0]);
      }
      passes++;
    }
    if(call.name.endsWith('_checked')) {
      for(const requester of [stale,id(99)]) {
        await reset();
        await query(`insert into jfl_private.player_match_score_claims
          (player_match_id,scoring_team_id,owner_user_id,pending_requester_user_id,pending_expires_at)
          values($1,$2,$3,$4,now()-interval '1 second')`,[match,team,owner,requester]);
        const args=[...call.args]; args[0]=requester===stale?stale:owner;
        args[args.length-1]='[]';
        const before=await snapshot();
        await assert.rejects(query(call.sql,args),/History changed/);
        assert.deepEqual(await snapshot(),before,'History conflict rolls expiry and its audit back');
        passes++;
      }
    }
  }
  // Replace the tracker double with the repository's real membership resolver.
  // Schema substitution only; claim-specific eligibility remains a double and
  // this is deliberately NOT a qualification of the hosted roster definition.
  await query(`alter table jfl.player_matches add column team_a_id uuid,
    add column team_b_id uuid, add column player_a_id uuid, add column player_b_id uuid;
    create table jfl.players(id uuid primary key,user_id uuid);
    create table jfl.team_memberships(player_id uuid,season_id uuid,team_id uuid,ends_at timestamptz)`);
  const rosterSource=await readFile(new URL('../supabase/migrations/20260816213000_reject_dual_team_scoring.sql',import.meta.url),'utf8');
  await query(rosterSource.replaceAll('private.','jfl_private.').replaceAll('public.','jfl.'));
  await query('update jfl.player_matches set team_a_id=$1,team_b_id=$2,player_a_id=$3,player_b_id=$4',[team,id(88),tracker,id(89)]);
  await query('insert into jfl.players values($1,$2)',[id(30),owner]);
  for(const call of calls) {
    for(const mode of ['eligible','ended','other-season','opposing','dual','unrelated','no-roster']) {
      await reset(); await query('truncate jfl.team_memberships');
      if(mode!=='no-roster') await query('insert into jfl.team_memberships values($1,$2,$3,$4)',
        [id(30),mode==='other-season'?id(90):id(9),mode==='opposing'?id(88):mode==='unrelated'?id(91):team,mode==='ended'?new Date():null]);
      if(mode==='dual') await query('insert into jfl.team_memberships values($1,$2,$3,null)',[id(30),id(9),id(88)]);
      await query('insert into jfl_private.player_match_score_claims values($1,$2,$3)',[match,team,owner]);
      const args=[...call.args];
      if(call.name.startsWith('record')) await query("update jfl_private.player_match_score_submissions set racks='[]'");
      if(call.name.endsWith('_checked')) args[args.length-1]=JSON.stringify(
        (await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks);
      const before=await snapshot();
      if(mode==='eligible') {
        assert.equal((await query(call.sql,args)).rows[0].tracker_player_id,tracker);
      } else {
        await assert.rejects(query(call.sql,args),/not an active member|active on both teams/);
        assert.deepEqual(await snapshot(),before,'Ownership cannot override roster eligibility');
      }
      passes++;
    }
  }
  console.log(`${passes} native PostgreSQL cases PASS; actual eight RPCs + expiry resolver + repository membership resolver; claim eligibility is an isolated double; no hosted acceptance`);
} finally {
  await db.end();
  await admin.query(`drop database ${config.database}`);
  await admin.end();
}
