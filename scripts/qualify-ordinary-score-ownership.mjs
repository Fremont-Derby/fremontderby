// Disposable LOCAL PostgreSQL only. Real eight RPC bodies, minimal relations;
// Real repository/captured dependencies; minimal local relations, not hosted acceptance.
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
    alter table jfl.player_matches add column team_a_id uuid,
      add column team_b_id uuid, add column player_a_id uuid, add column player_b_id uuid;
    create table jfl.players(id uuid primary key,user_id uuid,display_name text);
    create table jfl.team_memberships(player_id uuid,season_id uuid,team_id uuid,ends_at timestamptz);
    create table jfl_private.player_competition_restrictions(season_id uuid,player_id uuid,reason text,lifted_at timestamptz)`);
  const rosterSource=await readFile(new URL('../supabase/migrations/20260816213000_reject_dual_team_scoring.sql',import.meta.url),'utf8');
  await query(rosterSource.replaceAll('private.','jfl_private.').replaceAll('public.','jfl.'));
  await query(await readFile(new URL('../test/fixtures/jfl-score-claim-eligibility.sql',import.meta.url),'utf8'));
  const historySource = await readFile(new URL('../supabase/migrations/20260812001000_collision_safe_shared_scoring.sql', import.meta.url), 'utf8');
  const realHistory = historySource.slice(0, historySource.indexOf('create or replace function public.record_player_match_score_rack_checked'))
    .replaceAll('private.', 'jfl_private.').replaceAll('public.', 'jfl.');
  await query(realHistory);
  await query(await readFile(new URL('../test/fixtures/jfl-score-claim-transitions.sql',import.meta.url),'utf8'));
  const helperSignatures = [
    'jfl_private.require_score_claim_actor(uuid,jfl.player_matches,uuid)',
    'jfl_private.score_claim_actor_is_eligible(uuid,jfl.player_matches,uuid)',
    'jfl_private.match_tracker_for_scoring_team(uuid,jfl.player_matches,uuid)',
    'jfl_private.assert_expected_score_history(uuid,uuid,jsonb)',
  ];
  const transitionSignatures = ['get_player_match_score_claim','claim_player_match_score','request_player_match_score_takeover','release_player_match_score_claim'].map(name => `jfl.${name}(uuid,uuid,uuid)`);
  transitionSignatures.push('jfl.respond_player_match_score_takeover(uuid,uuid,uuid,text)');
  // Retain the qualified service-only privilege boundary.
  for (const signature of [...helperSignatures,...transitionSignatures]) await query(`alter function ${signature} security definer; alter function ${signature} set search_path=''; revoke all on function ${signature} from public,anon,authenticated; grant execute on function ${signature} to service_role`);
  const resolver=await readFile(new URL('../test/fixtures/jfl-score-takeover-resolver.sql',import.meta.url),'utf8');
  await query(resolver.slice(resolver.indexOf('create or replace function')));
  for (const row of baseline) {
    await query(row.definition);
    const signature=row.definition.match(/FUNCTION ([^(]+\([^\n]+\))/)[1];
    await query(`revoke all on function ${signature} from public,anon,authenticated; grant execute on function ${signature} to service_role`);
  }
  await query("insert into jfl.player_matches(id,season_id,status,race_to_a,race_to_b,opening_block_length,opening_discipline,team_a_id,team_b_id,player_a_id,player_b_id) values($1,$2,'playing',1,1,2,'8-ball',$3,$4,$5,$6)",[match,id(9),team,id(88),tracker,id(89)]);
  await query('insert into jfl.players(id,user_id) values($1,$2),($3,$4)',[id(30),owner,id(31),stale]);
  await query('insert into jfl.team_memberships values($1,$3,$4,null),($2,$3,$4,null)',[id(30),id(31),id(9),team]);
  const reset = async () => {
    await query('truncate jfl_private.player_match_score_claims,jfl_private.player_match_score_submissions,jfl_private.audit_events');
    await query("insert into jfl_private.player_match_score_submissions(season_id,player_match_id,tracker_player_id,racks) values($1,$2,$3,$4)",[id(9),match,tracker,JSON.stringify([{rackNumber:1,discipline:'8-ball',winnerSide:'A'}])]);
  };
  // Negative control: former owner can edit the qualified baseline.
  await reset();
  const edit=calls.find(c=>c.name==='update_player_match_score_rack');
  await query(edit.sql,[stale,match,team,1,'B']);
  assert.equal((await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks[0].winnerSide,'B'); passes++;
  // An unknown existing guard must never be adopted by CREATE OR REPLACE.
  const guardSignature = 'jfl_private.require_current_scorekeeper(uuid,uuid,uuid)';
  const catalogSnapshot = async () => (await query(`select p.oid::regprocedure::text signature,
    pg_get_functiondef(p.oid) definition, p.proowner::regrole::text owner, p.proacl::text acl
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('jfl','jfl_private') order by p.oid`)).rows;
  for (const drift of ['owner', 'extra-grant']) {
    await query('begin');
    const before = await catalogSnapshot();
    await query(`create function ${guardSignature} returns void language plpgsql as $$ begin null; end $$;
      revoke all on function ${guardSignature} from public,anon,authenticated;
      grant execute on function ${guardSignature} to service_role`);
    if (drift === 'owner') await query(`alter function ${guardSignature} owner to service_role`);
    else {
      await query('create role ownership_guard_unrelated');
      await query(`grant execute on function ${guardSignature} to ownership_guard_unrelated`);
    }
    await query('savepoint guard_refusal');
    const drifted = await catalogSnapshot();
    await assert.rejects(query(candidate), /ownership guard already exists/);
    await query('rollback to savepoint guard_refusal');
    assert.deepEqual(await catalogSnapshot(), drifted, 'Refusal preserves existing owner, ACL and bodies');
    await query('rollback');
    assert.deepEqual(await catalogSnapshot(), before, 'Rollback restores exact baseline catalogs');
    passes++;
  }
  // New objects inherit both global and schema defaults, even with no old guard.
  const defaultsSnapshot = async () => (await query(`select defaclrole::text owner,
    defaclnamespace::text namespace, defaclobjtype, defaclacl::text acl
    from pg_default_acl order by oid`)).rows;
  for (const scope of ['', 'in schema jfl_private']) {
    await query('begin');
    const before = await catalogSnapshot(), defaultsBefore = await defaultsSnapshot();
    await query('create role ownership_guard_default_grantee');
    await query(`alter default privileges for role postgres ${scope}
      grant execute on functions to ownership_guard_default_grantee`);
    // Reproduce why the existing three named revokes are insufficient.
    await query(`create function ${guardSignature} returns void language plpgsql as $$ begin null; end $$;
      revoke all on function ${guardSignature} from public,anon,authenticated;
      grant execute on function ${guardSignature} to service_role`);
    assert.equal((await query("select has_function_privilege('ownership_guard_default_grantee',$1,'EXECUTE') allowed", [guardSignature])).rows[0].allowed, true);
    await query(`drop function ${guardSignature}`);
    const drifted = await catalogSnapshot(), defaultsDrifted = await defaultsSnapshot();
    await query('savepoint default_refusal');
    await assert.rejects(query(candidate), /ownership guard creation privileges/);
    await query('rollback to savepoint default_refusal');
    assert.deepEqual(await catalogSnapshot(), drifted, 'Refusal preserves all functions');
    assert.deepEqual(await defaultsSnapshot(), defaultsDrifted, 'Refusal never rewrites database defaults');
    await query('rollback');
    assert.deepEqual(await catalogSnapshot(), before);
    assert.deepEqual(await defaultsSnapshot(), defaultsBefore);
    passes++;
  }
  // Each dependency drift must fail before creating any ownership enforcement DDL.
  for (const signature of [...helperSignatures, 'jfl_private.resolve_expired_score_takeover(uuid,uuid)']) {
    for (const drift of [
      `grant execute on function ${signature} to public`,
      `grant execute on function ${signature} to authenticated`,
      `alter function ${signature} security invoker`,
      `alter function ${signature} owner to service_role`,
      `alter function ${signature} set search_path='public'`,
      `drop function ${signature}`,
    ]) {
      await query('begin'); await query(drift);
      await assert.rejects(query(candidate), /private scoring helper security boundary/);
      await query('rollback');
      assert.equal((await query("select to_regprocedure('jfl_private.require_current_scorekeeper(uuid,uuid,uuid)') p")).rows[0].p, null);
      passes++;
    }
  }
  // The five transition entrypoints are also privileged dependencies. Refuse
  // drift before installing enforcement, without repairing another object's ACL.
  for (const signature of transitionSignatures) {
    for (const drift of [
      `grant execute on function ${signature} to public`,
      `grant execute on function ${signature} to authenticated`,
      `alter function ${signature} security invoker`,
      `alter function ${signature} owner to service_role`,
      `alter function ${signature} set search_path='public'`,
      `drop function ${signature}`,
    ]) {
      await query('begin');
      const original=await catalogSnapshot();
      await query(drift);
      const drifted=await catalogSnapshot();
      await query('savepoint transition_refusal');
      await assert.rejects(query(candidate), /Unqualified scoring dependency body or security boundary/);
      await query('rollback to savepoint transition_refusal');
      assert.deepEqual(await catalogSnapshot(),drifted);
      await query('rollback');
      assert.deepEqual(await catalogSnapshot(),original);
      passes++;
    }
  }
  // Body drift must fail before installing any enforcement DDL, preserving the
  // exact drifted function definitions, owners and ACLs after the refusal.
  const pinnedDependencies = [...helperSignatures,
    'jfl.get_player_match_score_claim(uuid,uuid,uuid)',
    'jfl.claim_player_match_score(uuid,uuid,uuid)',
    'jfl.request_player_match_score_takeover(uuid,uuid,uuid)',
    'jfl.respond_player_match_score_takeover(uuid,uuid,uuid,text)',
    'jfl.release_player_match_score_claim(uuid,uuid,uuid)'];
  for (const signature of pinnedDependencies) {
    await query('begin');
    const original = await catalogSnapshot();
    const definition = (await query('select pg_get_functiondef(to_regprocedure($1)) definition',[signature])).rows[0].definition;
    await query(definition.replace(/AS (\$\w*\$)/, '$&\n-- deliberate dependency body drift'));
    const drifted = await catalogSnapshot();
    assert.notDeepEqual(drifted,original);
    await query('savepoint body_refusal');
    await assert.rejects(query(candidate), /Unqualified scoring dependency body/);
    await query('rollback to savepoint body_refusal');
    assert.deepEqual(await catalogSnapshot(),drifted);
    await query('rollback');
    assert.deepEqual(await catalogSnapshot(),original);
    passes++;
  }
  // Changing SECURITY DEFINER ownership changes whose authority executes the body.
  for (const row of baseline) {
    const signature=(await query("select p.oid::regprocedure::text signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='jfl' and p.proname=$1",[row.proname])).rows[0].signature;
    const original=(await query('select pg_get_functiondef(to_regprocedure($1)) definition',[signature])).rows[0].definition;
    await query('begin');
    await query(`alter function ${signature} owner to service_role`);
    const before=(await query('select pg_get_functiondef(to_regprocedure($1)) definition',[signature])).rows[0].definition;
    await assert.rejects(query(candidate), /Unqualified #3288 baseline/);
    await query('rollback');
    assert.equal((await query("select to_regprocedure('jfl_private.require_current_scorekeeper(uuid,uuid,uuid)') p")).rows[0].p,null);
    const after=(await query('select pg_get_functiondef(to_regprocedure($1)) definition',[signature])).rows[0].definition;
    assert.equal(after, original);
    assert.ok(before.includes('SECURITY DEFINER'));
    passes++;
  }
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
      await assert.rejects(query(call.sql,args),/current scorekeeper|not an active member|not a member/);
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
  await assert.rejects(query(checked.sql,[owner,match,team,1,'B','[]']),/Score changed on another device/); passes++;
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
        await assert.rejects(query(call.sql,args),/Score changed on another device/);
        assert.deepEqual(await snapshot(),before,'History conflict rolls expiry and its audit back');
        passes++;
      }
    }
  }
  // Real membership boundary matrix.
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
  for(const call of calls) {
    for(const mode of ['eligible','restricted','lifted','other-season']) {
      await reset(); await query('truncate jfl.team_memberships,jfl_private.player_competition_restrictions');
      await query('insert into jfl.team_memberships values($1,$2,$3,null)',[id(30),id(9),team]);
      if(mode!=='eligible') await query('insert into jfl_private.player_competition_restrictions values($1,$2,$3,$4)',
        [mode==='other-season'?id(90):id(9),id(30),'test competition restriction',mode==='lifted'?new Date():null]);
      await query('insert into jfl_private.player_match_score_claims values($1,$2,$3)',[match,team,owner]);
      const args=[...call.args];
      if(call.name.startsWith('record')) await query("update jfl_private.player_match_score_submissions set racks='[]'");
      if(call.name.endsWith('_checked')) args[args.length-1]=JSON.stringify(
        (await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks);
      const before=await snapshot();
      if(mode==='restricted') {
        await assert.rejects(query(call.sql,args),/marked ineligible for competition/);
        assert.deepEqual(await snapshot(),before);
      } else assert.equal((await query(call.sql,args)).rows[0].tracker_player_id,tracker);
      passes++;
    }
  }
  // Eligibility can change during the 15-second warning. Use the real
  // membership and captured restriction helpers throughout the matrix.

  for(const call of calls) {
    for(const mode of ['eligible','restricted','ended','dual','opposing','other-season','no-roster']) {
      for(const actor of [owner,stale]) {
        await reset();
        await query('truncate jfl.team_memberships,jfl_private.player_competition_restrictions');
        await query('insert into jfl.team_memberships values($1,$2,$3,null)',[id(30),id(9),team]);
        if(mode!=='no-roster') await query('insert into jfl.team_memberships values($1,$2,$3,$4)',
          [id(31),mode==='other-season'?id(90):id(9),mode==='opposing'?id(88):team,mode==='ended'?new Date():null]);
        if(mode==='dual') await query('insert into jfl.team_memberships values($1,$2,$3,null)',[id(31),id(9),id(88)]);
        if(mode==='restricted') await query('insert into jfl_private.player_competition_restrictions values($1,$2,$3,null)',[id(9),id(31),'new restriction']);
        await query(`insert into jfl_private.player_match_score_claims
          (player_match_id,scoring_team_id,owner_user_id,pending_requester_user_id,pending_requested_at,pending_expires_at)
          values($1,$2,$3,$4,now()-interval '16 seconds',now()-interval '1 second')`,[match,team,owner,stale]);
        const args=[...call.args]; args[0]=actor;
        if(call.name.startsWith('record')) await query("update jfl_private.player_match_score_submissions set racks='[]'");
        if(call.name.endsWith('_checked')) args[args.length-1]=JSON.stringify(
          (await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks);
        const before=await snapshot();
        const nextOwner=mode==='eligible'?stale:owner;
        if(actor!==nextOwner) {
          await assert.rejects(query(call.sql,args),/current scorekeeper|active member|both teams|ineligible for competition/);
          assert.deepEqual(await snapshot(),before,'Rejected scoring rolls back lazy transfer/clear and audit');
        } else {
          assert.equal((await query(call.sql,args)).rows[0].tracker_player_id,tracker);
          const claim=(await query('select * from jfl_private.player_match_score_claims')).rows[0];
          assert.equal(claim.owner_user_id,nextOwner);
          assert.equal(claim.pending_requester_user_id,null);
          assert.equal(claim.pending_expires_at,null);
          const transitions=(await query("select * from jfl_private.audit_events where action like 'player_match.scorekeeper_takeover_%'")).rows;
          assert.equal(transitions.length,1,'Exactly one expiry transition, including checked wrappers');
          assert.equal(transitions[0].action,mode==='eligible'?'player_match.scorekeeper_takeover_auto_transfer':'player_match.scorekeeper_takeover_ineligible');
          assert.equal(transitions[0].after_state.ownerUserId,nextOwner);
          assert.equal(transitions[0].after_state.scoringTeamId,team);
        }
        passes++;
      }
    }
  }
  // Repeat from the other authoritative side. An A claim cannot authorize B,
  // even when the actor is otherwise an eligible B team member.
  for(const call of calls) {
    for(const mode of ['side-b-owner','side-a-claim','side-b-former']) {
      await reset(); await query('truncate jfl.team_memberships,jfl_private.player_competition_restrictions');
      await query('insert into jfl.team_memberships values($1,$2,$3,null)',[id(30),id(9),id(88)]);
      await query('update jfl_private.player_match_score_submissions set tracker_player_id=$1',[id(89)]);
      await query('insert into jfl_private.player_match_score_claims values($1,$2,$3)',
        [match,mode==='side-a-claim'?team:id(88),mode==='side-b-former'?stale:owner]);
      const args=[...call.args]; args[2]=id(88);
      if(call.name.startsWith('record')) await query("update jfl_private.player_match_score_submissions set racks='[]'");
      if(call.name.endsWith('_checked')) args[args.length-1]=JSON.stringify(
        (await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks);
      const before=await snapshot();
      if(mode==='side-b-owner') {
        assert.equal((await query(call.sql,args)).rows[0].tracker_player_id,id(89));
        const audit=(await query('select after_state from jfl_private.audit_events')).rows[0].after_state;
        assert.equal(audit.scoringTeamId,id(88));
        assert.equal(audit.trackerPlayerId,id(89));
      } else {
        await assert.rejects(query(call.sql,args),/current scorekeeper/);
        assert.deepEqual(await snapshot(),before);
      }
      passes++;
    }
  }
  // Connect the ordinary guards to real claim/request/respond/pass entrypoints.

  for(const call of calls) {
    for(const mode of ['release','deny','pass']) {
      await reset();
      await query('truncate jfl.team_memberships,jfl_private.player_competition_restrictions');
      await query('insert into jfl.team_memberships values($1,$3,$4,null),($2,$3,$4,null)',[id(30),id(31),id(9),team]);
      await query('select * from jfl.claim_player_match_score($1,$2,$3)',[owner,match,team]);
      if(mode==='pass') {
        await query('select * from jfl.release_player_match_score_claim($1,$2,$3)',[owner,match,team]);
        const before=await snapshot();
        await assert.rejects(query(call.sql,call.args),/current scorekeeper/);
        assert.deepEqual(await snapshot(),before);
        await query('select * from jfl.claim_player_match_score($1,$2,$3)',[stale,match,team]);
      } else {
        const pending=(await query('select * from jfl.request_player_match_score_takeover($1,$2,$3)',[stale,match,team])).rows[0];
        assert.equal(pending.owner_user_id,owner);
        assert.equal(pending.pending_requester_user_id,stale);
        const before=await snapshot(); const requestArgs=[...call.args]; requestArgs[0]=stale;
        await assert.rejects(query(call.sql,requestArgs),/current scorekeeper/);
        assert.deepEqual(await snapshot(),before);
        await query('select * from jfl.respond_player_match_score_takeover($1,$2,$3,$4)',[owner,match,team,mode]);
      }
      const winner=mode==='deny'?owner:stale, loser=winner===owner?stale:owner;
      const args=[...call.args]; args[0]=loser;
      const before=await snapshot();
      await assert.rejects(query(call.sql,args),/current scorekeeper/);
      assert.deepEqual(await snapshot(),before);
      if(call.name.startsWith('record')) await query("update jfl_private.player_match_score_submissions set racks='[]'");
      if(call.name.endsWith('_checked')) args[args.length-1]=JSON.stringify(
        (await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks);
      args[0]=winner;
      assert.equal((await query(call.sql,args)).rows[0].tracker_player_id,tracker);
      assert.equal((await query('select owner_user_id from jfl_private.player_match_score_claims')).rows[0].owner_user_id,winner);
      passes++;
    }
  }
  // Captured forward repair: Release revalidates the recipient at transfer time.
  for (const mode of ['ended','restricted','opposing']) {
    await reset(); await query('truncate jfl.team_memberships,jfl_private.player_competition_restrictions');
    await query('insert into jfl.team_memberships values($1,$3,$4,null),($2,$3,$4,null)',[id(30),id(31),id(9),team]);
    await query('select * from jfl.claim_player_match_score($1,$2,$3)',[owner,match,team]);
    await query('select * from jfl.request_player_match_score_takeover($1,$2,$3)',[stale,match,team]);
    if(mode==='ended') await query('update jfl.team_memberships set ends_at=now() where player_id=$1',[id(31)]);
    if(mode==='opposing') await query('update jfl.team_memberships set team_id=$1 where player_id=$2',[id(88),id(31)]);
    if(mode==='restricted') await query('insert into jfl_private.player_competition_restrictions values($1,$2,$3,null)',[id(9),id(31),'restricted during warning']);
    const scores=(await snapshot()).scores;
    await query("select * from jfl.respond_player_match_score_takeover($1,$2,$3,'release')",[owner,match,team]);
    const state=await snapshot();
    assert.equal(state.claims[0].owner_user_id,owner);
    assert.equal(state.claims[0].pending_requester_user_id,null);
    assert.equal(state.claims[0].pending_expires_at,null);
    assert.deepEqual(state.scores,scores);
    assert.equal(state.audit.at(-1).action,'player_match.scorekeeper_takeover_ineligible');
    passes++;
  }
  // Real concurrent requests: the second connection waits, then loses to the
  // committed pending requester. Exercise both arrival orders deterministically.
  await query('insert into jfl.players(id,user_id) values($1,$2)',[id(32),id(40)]);
  for(const [firstActor,secondActor] of [[stale,id(40)],[id(40),stale]]) {
    await reset(); await query('truncate jfl.team_memberships,jfl_private.player_competition_restrictions');
    for(const player of [id(30),id(31),id(32)]) await query('insert into jfl.team_memberships values($1,$2,$3,null)',[player,id(9),team]);
    await query('select * from jfl.claim_player_match_score($1,$2,$3)',[owner,match,team]);
    const a=new Client(config), b=new Client(config);
    await a.connect(); await b.connect();
    let pending;
    try {
      await a.query('begin');
      await a.query('select * from jfl.request_player_match_score_takeover($1,$2,$3)',[firstActor,match,team]);
      const pid=(await b.query('select pg_backend_pid() pid')).rows[0].pid;
      pending=b.query('select * from jfl.request_player_match_score_takeover($1,$2,$3)',[secondActor,match,team]).then(()=>({ok:true}),error=>({error}));
      let waiting=false;
      for(let i=0;i<100;i++) {
        if((await query('select wait_event_type from pg_stat_activity where pid=$1',[pid])).rows[0].wait_event_type==='Lock'){waiting=true;break;}
        await new Promise(resolve=>setTimeout(resolve,10));
      }
      assert.ok(waiting,'Second real takeover request must wait for match lock');
      await a.query('commit');
      assert.match((await pending).error?.message||'',/already pending/);
      const claim=(await query('select * from jfl_private.player_match_score_claims')).rows[0];
      assert.equal(claim.owner_user_id,owner); assert.equal(claim.pending_requester_user_id,firstActor);
      assert.equal((await query("select count(*)::int n from jfl_private.audit_events where action='player_match.scorekeeper_takeover_request'")).rows[0].n,1);
      passes++;
    } finally { await a.query('rollback'); if(pending) await pending; await a.end(); await b.end(); }
  }
  // Pristine reinstallation verifies exact catalog rollback with real dependencies.
  // Roll back to the exact exercised catalog after qualifying this installation.
  await query('begin');
  const qualifiedCatalog = await catalogSnapshot();
  try {
    await query(`drop function ${guardSignature}`);
    for (const row of baseline) await query(row.definition);
    await query(realHistory);
    const pristineCatalog = await catalogSnapshot();
    await query(candidate);
    // Installing enforcement must preserve every dependency body, owner and ACL.
    const dependencies = rows => rows.filter(row => row.signature.startsWith('jfl_private.') && !row.signature.startsWith('jfl_private.require_current_scorekeeper('));
    assert.deepEqual(dependencies(await catalogSnapshot()), dependencies(pristineCatalog));
    passes++;
    for (const call of calls) {
      await reset();
      await query('truncate jfl.team_memberships,jfl_private.player_competition_restrictions');
      await query('insert into jfl.team_memberships values($1,$3,$4,null),($2,$3,$4,null)', [id(30),id(31),id(9),team]);
      await query('select * from jfl.claim_player_match_score($1,$2,$3)', [owner,match,team]);
      const args = [...call.args];
      if (call.name.startsWith('record')) await query("update jfl_private.player_match_score_submissions set racks='[]'");
      if (call.name.endsWith('_checked')) args[args.length-1] = JSON.stringify((await query('select racks from jfl_private.player_match_score_submissions')).rows[0].racks);
      const before = await snapshot();
      const staleArgs = [...args]; staleArgs[0] = stale;
      await query('savepoint stale_denial');
      await assert.rejects(query(call.sql,staleArgs), /current scorekeeper/);
      await query('rollback to savepoint stale_denial');
      assert.deepEqual(await snapshot(),before);
      await query(call.sql,args);
      passes++;
    }
    // Real history helper rejects stale optimistic snapshots without data/audit writes.
    await reset();
    await query('select * from jfl.claim_player_match_score($1,$2,$3)', [owner,match,team]);
    const before = await snapshot();
    const checked = calls.find(call => call.name === 'update_player_match_score_rack_checked');
    const args = [...checked.args]; args[args.length-1] = '[]';
    await query('savepoint history_denial');
    await assert.rejects(query(checked.sql,args), /Score changed on another device/);
    await query('rollback to savepoint history_denial');
    assert.deepEqual(await snapshot(),before);
    passes++;
  } finally {
    await query('rollback');
  }
  assert.deepEqual(await catalogSnapshot(),qualifiedCatalog,'Pristine qualification restores the exact prior catalog');
  passes++;
  // Separate experiment: committed installation, compensating COMMIT recovery.
  const recovery = await readFile(new URL('./sql/jfl-ordinary-score-ownership.recovery.sql',import.meta.url),'utf8');
  await query('begin');
  for (const row of baseline) await query(row.definition);
  await query(`drop function ${guardSignature} restrict`);
  await query(realHistory);
  await query('commit');
  const recoveryBaseline = await catalogSnapshot(), recoveryData = await snapshot();
  await query(`begin; ${candidate}; commit;`);
  const installedCatalog = await catalogSnapshot();
  // Midway failure after real restoration must leave committed enforcement intact.
  const restoreStart = recovery.indexOf('CREATE OR REPLACE FUNCTION');
  const secondRestore = recovery.indexOf('CREATE OR REPLACE FUNCTION',restoreStart+1);
  await assert.rejects(query(recovery.slice(0,secondRestore)+"select 1/0;"), /division by zero/);
  await query('rollback');
  assert.deepEqual(await catalogSnapshot(),installedCatalog);
  assert.deepEqual(await snapshot(),recoveryData); passes++;
  // Refuse each candidate/guard body plus privilege and configuration drift.
  const signatures = installedCatalog.filter(row => row.signature === guardSignature || baseline.some(b => row.signature.startsWith(`jfl.${b.proname}(`))).map(row => row.signature);
  const recoveryBody = recovery.replace(/^begin;$/m,'').replace(/^commit;$/m,'');
  for (const signature of signatures) {
    const original = installedCatalog.find(row => row.signature === signature);
    for (const drift of ['body','owner','acl','search_path']) {
      await query('begin');
      if(drift === 'body') await query(original.definition.replace(/AS (\$\w+\$)/, '$&\n-- unqualified drift\n'));
      if(drift === 'owner') await query(`alter function ${signature} owner to service_role`);
      if(drift === 'acl') await query(`grant execute on function ${signature} to authenticated`);
      if(drift === 'search_path') await query(`alter function ${signature} set search_path=public`);
      const drifted = await catalogSnapshot();
      await query('savepoint refusal');
      await assert.rejects(query(recoveryBody), /Unqualified committed ownership recovery baseline/);
      await query('rollback to savepoint refusal');
      assert.deepEqual(await catalogSnapshot(),drifted);
      assert.deepEqual(await snapshot(),recoveryData);
      await query('rollback'); passes++;
    }
  }
  await query(recovery);
  assert.deepEqual(await catalogSnapshot(),recoveryBaseline,'Committed recovery restores exact original catalog');
  assert.deepEqual(await snapshot(),recoveryData,'Committed recovery preserves every score/claim/audit row'); passes++;
  await assert.rejects(query(recovery), /Unqualified committed ownership recovery baseline/);
  await query('rollback');
  assert.deepEqual(await catalogSnapshot(),recoveryBaseline); passes++;
  console.log(`${passes} native PostgreSQL cases PASS; eight RPCs, real dependency installation and rollback; minimal relations, no hosted acceptance`);
} finally {
  await db.end();
  await admin.query(`drop database ${config.database}`);
  await admin.end();
}
