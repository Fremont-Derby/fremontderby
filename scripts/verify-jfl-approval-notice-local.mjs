// LOCAL PostgreSQL regression proof only. No network or hosted credentials.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { isAbsolute } from 'node:path';

const runtime = process.env.JFL_SQL_TEST_RUNTIME_PACKAGE_JSON;
assert(runtime && isAbsolute(runtime), 'Point JFL_SQL_TEST_RUNTIME_PACKAGE_JSON at a temporary PGlite0.5.12 runtime package.json');
const { PGlite } = createRequire(runtime)('@electric-sql/pglite');
const db = new PGlite();
const sql = (await readFile(new URL('../supabase/migrations/20261026180914_jfl_team_application_approval_notice.sql', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
const admin = '11111111-1111-4111-8111-111111111111';
const recipient = '22222222-2222-4222-8222-222222222222';
const outsider = '33333333-3333-4333-8333-333333333333';
const linked = '44444444-4444-4444-8444-444444444444';
const unlinked = '55555555-5555-4555-8555-555555555555';
const rows = async (query, values = []) => (await db.query(query, values)).rows;
const count = async (query, values = []) => Number((await rows(query, values))[0].count);
let checks = 0;
function pass(label) { checks++; console.log('PASS ' + label); }
async function application(player = linked, name = 'Approved synthetic team') {
  const season = randomUUID(), id = randomUUID();
  await db.query('insert into jfl.seasons(id,name,status) values($1,$2,$3)', [season, 'Synthetic season', 'registration']);
  await db.query('insert into jfl_private.team_applications(id,season_id,applicant_player_id,proposed_team_name) values($1,$2,$3,$4)', [id, season, player, name]);
  return { id, season };
}
async function review(id, decision = 'approve', actor = admin) {
  await db.exec('set role service_role');
  try { return await rows('select * from jfl.admin_review_team_application($1,$2,$3,$4)', [actor, id, decision, 'Private admin-only reason']); }
  finally { await db.exec('reset role'); }
}
try {
  await db.exec(await readFile(new URL('../test/fixtures/jfl-approval-schema.sql', import.meta.url), 'utf8'));
  const entrypoints = (await readFile(new URL('../test/fixtures/jfl-approval-entrypoints.sql', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  await db.exec(entrypoints);
  await db.exec('revoke all on function jfl.admin_review_team_application(uuid,uuid,text,text),jfl.list_my_notifications(uuid,integer),jfl.mark_my_notification_read(uuid,uuid) from public,anon,authenticated; grant execute on function jfl.admin_review_team_application(uuid,uuid,text,text),jfl.list_my_notifications(uuid,integer),jfl.mark_my_notification_read(uuid,uuid) to service_role');
  assert.equal((await rows("select md5(prosrc) as hash from pg_proc where oid='jfl.mark_my_notification_read(uuid,uuid)'::regprocedure"))[0].hash, 'ef239179a955693bef7717d33f991cbe');
  const peerBefore = JSON.stringify(await rows('select * from dru.approval_sentinel'));
  await db.exec('begin; grant select on jfl.user_notifications to authenticated;');
  await assert.rejects(db.exec(sql), /notification read boundary changed/);
  await db.exec('rollback');
  assert.equal((await rows("select to_regclass('jfl.user_notifications_application_approval_once') as object"))[0].object, null);
  pass('migration rejects a weakened browser table boundary before DDL');
  await db.exec('begin; alter table jfl.user_notifications disable row level security;');
  await assert.rejects(db.exec(sql), /notification read boundary changed/);
  await db.exec('rollback');
  pass('migration rejects disabled RLS');
  await db.exec('begin; ' + entrypoints.replace('Actor is not a league admin', 'Unreviewed actor guard'));
  await assert.rejects(db.exec(sql), /approval or Notice RPC baseline changed/);
  await db.exec('rollback');
  pass('migration rejects a changed approval implementation before DDL');
  await db.exec('begin; ' + sql + '\ncommit;');
  assert.equal(JSON.stringify(await rows('select * from dru.approval_sentinel')), peerBefore);
  const boundaries = (await rows(`select
    has_table_privilege('anon','jfl.user_notifications','select,insert,update,delete') as anon_table,
    has_table_privilege('authenticated','jfl.user_notifications','select,insert,update,delete') as auth_table,
    has_function_privilege('anon','jfl_private.notify_approved_team_application()','execute') as anon_producer,
    has_function_privilege('authenticated','jfl_private.notify_approved_team_application()','execute') as auth_producer`))[0];
  assert(Object.values(boundaries).every(value => value === false));
  const producer = (await rows("select prosecdef,proconfig,md5(prosrc) as source_md5 from pg_proc where oid='jfl_private.notify_approved_team_application()'::regprocedure"))[0];
  assert.equal(producer.prosecdef, false);
  assert.deepEqual(producer.proconfig, ['search_path=""']);
  pass('installed producer preserves read/RPC privacy and peer schema');
  await db.exec(await readFile(new URL('./inspect-jfl-approval-notice.sql', import.meta.url), 'utf8'));
  pass('installed-object verifier accepts the exact producer/index/trigger');
  await db.query('insert into jfl_private.league_admins values($1)', [admin]);
  await db.query('insert into jfl.players(id,user_id,display_name) values($1,$2,$3),($4,null,$5)', [linked, recipient, 'Synthetic applicant', unlinked, 'Unlinked fixture']);

  const first = await application();
  const approved = (await review(first.id))[0];
  const notices = await rows('select * from jfl.user_notifications');
  assert.equal(notices.length, 1);
  assert.equal(notices[0].recipient_user_id, recipient);
  assert.equal(notices[0].team_id, approved.team_id);
  assert.equal(notices[0].season_id, first.season);
  assert.equal(notices[0].created_by, admin);
  assert.equal(notices[0].href, '/teams?view=mine');
  assert.equal(notices[0].kind, 'team_application_approved');
  assert.equal(notices[0].payload.teamApplicationId, first.id);
  assert.match(notices[0].body, /Approved synthetic team in Synthetic season/);
  assert(!notices[0].body.includes('Private admin-only reason'));
  assert.equal(notices[0].read_at, null);
  pass('real approval entrypoint produces exactly one fixed recipient/team/season Notice');
  await assert.rejects(review(first.id), /no longer waiting for review/);
  assert.equal(await count('select count(*) from jfl.user_notifications'), 1);
  pass('duplicate approval cannot create another Notice');
  await db.exec('set role service_role');
  await assert.rejects(rows('select * from jfl.mark_my_notification_read($1,$2)', [outsider, notices[0].id]), /Notification not found/);
  assert.equal((await rows('select * from jfl.list_my_notifications($1,100)', [recipient]))[0].read_at, null);
  await assert.rejects(rows('select * from jfl.mark_my_notification_read($1,$2)', [recipient, randomUUID()]), /Notification not found/);
  pass('captured read-state RPC rejects nonrecipient and absent Notice with exact not-found behavior');
  const marked = (await rows('select * from jfl.mark_my_notification_read($1,$2)', [recipient, notices[0].id]))[0];
  assert.equal(marked.id, notices[0].id);
  assert(marked.read_at);
  assert.equal((await rows('select * from jfl.mark_my_notification_read($1,$2)', [recipient, notices[0].id]))[0].read_at, marked.read_at);
  await db.exec('reset role');
  pass('recipient marks its Notice through the unchanged RPC; repeated read preserves timestamp');
  const readAt = (await rows('select read_at::text from jfl.user_notifications where id=$1', [notices[0].id]))[0].read_at;
  await db.query("update jfl_private.team_applications set status='applied' where id=$1", [first.id]);
  await db.query("update jfl_private.team_applications set status='approved_pending_roster' where id=$1", [first.id]);
  assert.equal(await count('select count(*) from jfl.user_notifications'), 1);
  assert.equal((await rows('select read_at::text from jfl.user_notifications where id=$1', [notices[0].id]))[0].read_at, readAt);
  pass('event dedupe survives an adversarial repeated transition without resetting read state');
  const rejected = await application();
  await review(rejected.id, 'defer');
  await review(rejected.id, 'defer');
  await review(rejected.id, 'reject');
  assert.equal(await count('select count(*) from jfl.user_notifications'), 1);
  const deferred = await application();
  await review(deferred.id, 'defer');
  await review(deferred.id);
  assert.equal(await count('select count(*) from jfl.user_notifications'), 2);
  pass('defer/reject do not notify; deferred approval notifies once');
  await review((await application(unlinked)).id);
  assert.equal(await count('select count(*) from jfl.user_notifications'), 2);
  pass('unlinked records do not redirect a Notice to an Admin or arbitrary recipient');
  await db.exec('set role service_role');
  assert.equal((await rows('select * from jfl.list_my_notifications($1,100)', [recipient])).length, 2);
  assert.equal((await rows('select * from jfl.list_my_notifications($1,100)', [outsider])).length, 0);
  await db.exec('reset role; set role authenticated');
  await assert.rejects(rows('select * from jfl.list_my_notifications($1,100)', [recipient]), /permission denied/);
  await assert.rejects(rows('select * from jfl.user_notifications'), /permission denied/);
  await db.exec('reset role');
  pass('existing service-only inbox filters recipients and browser roles cannot spoof it');
  const denied = await application();
  await assert.rejects(review(denied.id, 'approve', outsider), /not a league admin/);
  assert.equal((await rows('select status from jfl_private.team_applications where id=$1', [denied.id]))[0].status, 'applied');
  await assert.rejects(db.query("update jfl_private.team_applications set status='approved_pending_roster',reviewed_by_user_id=$2 where id=$1", [denied.id, outsider]), /qualified Admin reviewer/);
  await assert.rejects(db.query("update jfl_private.team_applications set status='approved_pending_roster',reviewed_by_user_id=$2 where id=$1", [denied.id, admin]), /identity is incomplete/);
  pass('non-Admin review and incomplete/spoofed approval identities roll back');
  const atomic = await application();
  await db.exec("create function jfl_private.local_deny_notice() returns trigger language plpgsql as $$begin raise exception 'Synthetic Notice insertion failure'; end;$$; create trigger local_deny_notice before insert on jfl.user_notifications for each row execute function jfl_private.local_deny_notice();");
  await assert.rejects(review(atomic.id), /Synthetic Notice insertion failure/);
  assert.equal((await rows('select status from jfl_private.team_applications where id=$1', [atomic.id]))[0].status, 'applied');
  assert.equal(await count('select count(*) from jfl.teams where season_id=$1', [atomic.season]), 0);
  assert.equal(await count('select count(*) from jfl_private.season_team_slots where season_id=$1', [atomic.season]), 0);
  assert.equal(await count('select count(*) from jfl_private.audit_events where entity_id=$1', [atomic.id]), 0);
  await db.exec('drop trigger local_deny_notice on jfl.user_notifications; drop function jfl_private.local_deny_notice();');
  pass('Notice failure atomically rolls back approval, team, captain, slot and audit');
  const rolledBack = await application();
  await db.exec('begin');
  await review(rolledBack.id);
  assert.equal(await count('select count(*) from jfl.user_notifications where season_id=$1', [rolledBack.season]), 1);
  await db.exec('rollback');
  assert.equal(await count('select count(*) from jfl.user_notifications where season_id=$1', [rolledBack.season]), 0);
  assert.equal((await rows('select status from jfl_private.team_applications where id=$1', [rolledBack.id]))[0].status, 'applied');
  pass('transaction rollback retains neither approval nor Notice');
  await db.exec('begin');
  await assert.rejects(db.exec(sql), /objects\/data already exist/);
  await db.exec('rollback');
  assert.equal(await count('select count(*) from jfl.user_notifications'), 2);
  pass('reapplication fails closed without replacing existing objects or data');
  await db.exec(await readFile(new URL('./rollback-jfl-approval-notice.sql', import.meta.url), 'utf8'));
  assert.equal(await count('select count(*) from jfl.user_notifications'), 2);
  assert.equal((await rows('select read_at::text from jfl.user_notifications where id=$1', [notices[0].id]))[0].read_at, readAt);
  assert.equal((await rows("select to_regprocedure('jfl_private.notify_approved_team_application()') as producer"))[0].producer, null);
  assert.equal(JSON.stringify(await rows('select * from dru.approval_sentinel')), peerBefore);
  pass('qualified rollback removes only producer objects and preserves Notices/read state/peer');
  console.log(JSON.stringify({ scope: 'LOCAL minimal PostgreSQL fixture, captured approval/read entrypoints; not hosted acceptance', checks,
    engine: (await rows('select version()'))[0].version, pglite: '0.5.12', producerSourceMd5: producer.source_md5 }));
} finally { await db.close(); }
