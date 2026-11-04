// Destructive ONLY to a dedicated disposable local database named fd_takeover_test.
// PG_CLIENT_MODULE points to an installed pg package (no production credentials).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const { default: pg } = await import(pathToFileURL(process.env.PG_CLIENT_MODULE).href);
const config = { host: '127.0.0.1', port: Number(process.env.PG_TEST_PORT || 55466),
  user: 'postgres', database: 'fd_takeover_test' };
const clients = [];
async function connect(database = config.database) {
  const client = new pg.Client({ ...config, database });
  await client.connect(); clients.push(client); return client;
}
const match = '00000000-0000-4000-8000-000000000001';
const team = '00000000-0000-4000-8000-000000000002';
const owner = '00000000-0000-4000-8000-000000000003';
const incoming = '00000000-0000-4000-8000-000000000004';
const candidate = readFileSync(new URL('../supabase/migrations/20261104024000_jfl_score_takeover_match_lock.sql', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let databaseCreated = false;
try {
  const admin = await connect('postgres');
  await admin.query('create database fd_takeover_test');
  databaseCreated = true;
  const setup = await connect();
  await setup.query(`
    create schema jfl; create schema jfl_private;
    do $$ begin
      if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
      if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
      if not exists(select from pg_roles where rolname='service_role') then create role service_role; end if;
    end $$;
    create table jfl.player_matches(id uuid primary key);
    create table jfl_private.player_match_score_claims(
      player_match_id uuid, scoring_team_id uuid, owner_user_id uuid,
      claimed_at timestamptz, pending_requester_user_id uuid,
      pending_requested_at timestamptz, pending_expires_at timestamptz,
      last_transition_at timestamptz, primary key(player_match_id,scoring_team_id));
    create table jfl_private.audit_events(actor_user_id uuid,action text,entity_type text,
      entity_id uuid,reason text,before_state jsonb,after_state jsonb);
    create table jfl_private.eligible(user_id uuid primary key);
    create function jfl_private.score_claim_actor_is_eligible(uuid,jfl.player_matches,uuid)
      returns boolean language sql stable as 'select exists(select from jfl_private.eligible where user_id=$1)';
    insert into jfl.player_matches values ('${match}');
    insert into jfl_private.eligible values ('${incoming}');
  `);
  const resolver = await connect();
  const writer = await connect();
  async function seed(expired = true) {
    await setup.query('truncate jfl_private.player_match_score_claims,jfl_private.audit_events');
    await setup.query(`insert into jfl_private.player_match_score_claims values
      ($1,$2,$3,now(),$4,now(),now()+$5::interval,now())`,
    [match, team, owner, incoming, expired ? '-1 second' : '1 hour']);
  }
  async function resolve() {
    return resolver.query('select jfl_private.resolve_expired_score_takeover($1,$2)', [match, team]);
  }
  // Negative control: execute the exact candidate with only the match lock removed.
  await setup.query(candidate.slice(candidate.indexOf('create or replace function')).replace('where pm.id=target_player_match_id\n  for update;', 'where pm.id=target_player_match_id;'));
  await seed();
  await writer.query('begin');
  await writer.query('select * from jfl.player_matches where id=$1 for update', [match]);
  await resolver.query("set statement_timeout='2s'");
  await resolve();
  assert.equal((await setup.query('select owner_user_id from jfl_private.player_match_score_claims')).rows[0].owner_user_id, incoming);
  await writer.query('rollback');
  console.log('PASS negative control: old resolver transfers while match writer holds lock');

  await setup.query(candidate);
  await assert.rejects(setup.query(candidate), /differs from qualified/);
  console.log('PASS migration refuses an unqualified resolver body');
  await seed();
  await writer.query('begin');
  await writer.query('select * from jfl.player_matches where id=$1 for update', [match]);
  const pending = resolve();
  // Observe a real PostgreSQL lock wait rather than infer it from elapsed time.
  let waiting = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await setup.query("select wait_event_type from pg_stat_activity where pid=$1", [resolver.processID]);
    if (result.rows[0]?.wait_event_type === 'Lock') { waiting = true; break; }
    await delay(10);
  }
  assert.ok(waiting, 'resolver must wait on match lock');
  await writer.query("set local lock_timeout='500ms'");
  // Match owner can still acquire claim: resolver has not taken claim first.
  await writer.query('select * from jfl_private.player_match_score_claims for update');
  await writer.query('commit');
  await pending;
  assert.equal((await setup.query('select owner_user_id from jfl_private.player_match_score_claims')).rows[0].owner_user_id, incoming);
  console.log('PASS match-before-claim wait and eligible transfer');

  await seed(false); await resolve();
  assert.equal((await setup.query('select count(*)::int n from jfl_private.audit_events')).rows[0].n, 0);
  console.log('PASS pending takeover remains unchanged before deadline');
  await seed(); await setup.query('truncate jfl_private.eligible'); await resolve();
  const rejected = (await setup.query('select * from jfl_private.player_match_score_claims')).rows[0];
  assert.equal(rejected.owner_user_id, owner);
  assert.equal(rejected.pending_requester_user_id, null);
  assert.equal((await setup.query('select action from jfl_private.audit_events')).rows[0].action, 'player_match.scorekeeper_takeover_ineligible');
  console.log('PASS revoked recipient cleared and audited, owner retained');
  await setup.query('truncate jfl_private.player_match_score_claims'); await resolve();
  await resolver.query('select jfl_private.resolve_expired_score_takeover($1,$2)', [incoming, team]);
  console.log('PASS absent claim and absent match are no-ops');
  for (const role of ['anon', 'authenticated']) {
    assert.equal((await setup.query("select has_function_privilege($1,'jfl_private.resolve_expired_score_takeover(uuid,uuid)','execute') allowed", [role])).rows[0].allowed, false);
  }
  console.log('PASS browser roles cannot execute resolver');
} finally {
  const [admin, ...sessions] = clients;
  for (const client of sessions.reverse()) { await client.query('rollback').catch(() => {}); await client.end(); }
  if (databaseCreated) await admin.query('drop database fd_takeover_test');
  if (admin) await admin.end();
}
