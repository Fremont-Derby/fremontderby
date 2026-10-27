import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Supply an externally installed, pinned @electric-sql/pglite module path.
// This verifier never connects to Supabase or loads application credentials.
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
// pg_get_functiondef captures LF bodies; Git may check the fixture out as CRLF.
// Reconstruct those exact captured bodies before comparing their PG hashes.
const schema = (await readFile(new URL('../test/fixtures/jfl-full-season-actor-schema.sql', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const seed = await readFile(new URL('./seed-jfl-full-season-actors.sql', import.meta.url), 'utf8');
const cleanup = await readFile(new URL('./rollback-jfl-full-season-actors.sql', import.meta.url), 'utf8');
const actor = '36430000-0000-4000-8000-000000000001';
const player = '36430000-2000-4000-8000-000000000001';
const existing = 'aaaaaaaa-0000-4000-8000-000000000001';
const registration = `insert into jfl.seasons(id,purpose,status) values('${existing}','league','registration')`;

async function snapshot(db) {
  const tables = ['auth.users', 'jfl.players', 'jfl.player_ratings', 'jfl_private.player_contacts', 'jfl.seasons', 'jfl.season_players', 'jfl_private.payment_status', 'gamma.players',
    'jfl.teams','jfl.team_memberships','jfl.rounds','jfl.team_matches','jfl_private.team_applications','jfl_private.season_team_slots',
    'jfl.user_notifications','jfl_private.audit_events','jfl_private.audit_webhook_outbox','jfl.direct_message_consent','jfl.social_chat_consent'];
  const result = {};
  for (const table of tables) result[table] = (await db.query(`select to_jsonb(t) row from ${table} t order by to_jsonb(t)::text`)).rows;
  return result;
}

async function blocked(db, setup, message) {
  await db.exec(setup);
  const before = await snapshot(db);
  await assert.rejects(db.exec(seed), message);
  await db.exec('rollback');
  assert.deepEqual(await snapshot(db), before, 'failed bootstrap must preserve every prior row');
}

const cases = [
  ['bootstrap and idempotent replay preserve timestamps and existing history', async db => {
    await db.exec(`insert into auth.users(id,email) values('${existing}','original@fixture.invalid'); insert into jfl.players(id,user_id,display_name) values('${existing}','${existing}','Original Player');`);
    const before = await snapshot(db);
    await db.exec(seed);
    for (const table of ['auth.users', 'jfl.players', 'jfl.player_ratings', 'jfl_private.player_contacts']) {
      assert.equal((await db.query(`select count(*)::int total from ${table}`)).rows[0].total, table.endsWith('player_contacts') ? 8 : 9);
    }
    const after = await snapshot(db);
    for (const table of ['auth.users', 'jfl.players', 'jfl.player_ratings']) assert.deepEqual(after[table].filter(r => r.row.id === existing || r.row.player_id === existing), before[table]);
    assert.deepEqual(after['jfl.seasons'], before['jfl.seasons']);
    assert.equal(after['jfl.season_players'].length, 0);
    assert.equal(after['jfl_private.payment_status'].length, 0);
    await db.exec(seed);
    assert.deepEqual(await snapshot(db), after);
  }],
  ['exactly one public registration season fails before any new principal', db => blocked(db, registration, /auto-registration/)],
  ['three registration seasons do not create season registrations or payments', async db => {
    await db.exec(registration + `; insert into jfl.seasons(id,purpose,status) values('bbbbbbbb-0000-4000-8000-000000000001','qa','registration'),('cccccccc-0000-4000-8000-000000000001','league','registration')`);
    await db.exec(seed);
    assert.equal((await db.query('select count(*)::int total from jfl.season_players')).rows[0].total, 0);
    assert.equal((await db.query('select count(*)::int total from jfl_private.payment_status')).rows[0].total, 0);
  }],
  ['auth ID collision', db => blocked(db, `insert into auth.users(id,email) values('${actor}','real@fixture.invalid')`, /Partial full-season/)],
  ['auth email collision', db => blocked(db, `insert into auth.users(id,email) values('${existing}','full-season-captain-1@jfl.persona.invalid')`, /identity collision/)],
  ['player mapping collision', db => blocked(db, `insert into auth.users(id,email) values('${existing}','real@fixture.invalid'); insert into jfl.players(id,user_id,display_name) values('${player}','${existing}','Real player')`, /player\/contact/)],
  ['cross-lane binding', db => blocked(db, `insert into gamma.players(id,user_id) values('${existing}','${actor}')`, /outside JFL/)],
  ['additional auth trigger', db => blocked(db, `create function auth.unexpected() returns trigger language plpgsql as $$begin return new; end$$; create trigger unexpected after insert on auth.users for each row execute function auth.unexpected()`, /trigger behavior changed/)],
  ['changed player trigger function', db => blocked(db, `create or replace function jfl_private.seed_provisional_player_rating() returns trigger language plpgsql as $$begin return new; end$$`, /trigger behavior changed/)],
  ['existing password rejects replay', async db => {
    await db.exec(seed);
    await blocked(db, `update auth.users set encrypted_password='unusable-test-value' where id='${actor}'`, /identity collision/);
  }],
  ['existing session rejects replay', async db => {
    await db.exec(seed);
    await blocked(db, `insert into auth.sessions(id,user_id) values('${existing}','${actor}')`, /identity collision/);
  }],
  ['unexpected contact rejects replay', async db => {
    await db.exec(seed);
    await blocked(db, `update jfl_private.player_contacts set phone='not-fixture-contact' where player_id='${player}'`, /player\/contact/);
  }],
  ['qualified replay preserves active fixture registration and eligibility', async db => {
    await db.exec(seed);
    await db.exec(registration + `; insert into jfl.season_players values('${existing}','${player}','team','active')`);
    const before = await snapshot(db);
    await db.exec(seed);
    assert.deepEqual(await snapshot(db), before);
  }],
  ['missing existing contact is not silently repaired', async db => {
    await db.exec(seed);
    await blocked(db, `delete from jfl_private.player_contacts where player_id='${player}'`, /Incomplete existing/);
  }],
  ['partial principal set is not filled in', db => blocked(db, `insert into auth.users(id,email) values('${actor}','full-season-captain-1@jfl.persona.invalid')`, /Partial full-season/)],
  ['unexpected league-admin privilege rejects replay', async db => {
    await db.exec(seed);
    await blocked(db, `insert into jfl_private.league_admins values('${actor}')`, /league-admin privileges/);
  }],
  ['unused principal cleanup restores all preexisting rows', async db => {
    const before = await snapshot(db); await db.exec(seed); await db.exec(cleanup);
    assert.deepEqual(await snapshot(db), before);
  }],
  ['cleanup refuses fixture with season history', async db => {
    await db.exec(seed); await db.exec(registration + `; insert into jfl.season_players values('${existing}','${player}','team','active')`);
    const before = await snapshot(db);
    await assert.rejects(db.exec(cleanup), /season or admin state/); await db.exec('rollback');
    assert.deepEqual(await snapshot(db), before);
  }],
  ['cleanup discovers cross-lane FK dependencies and refuses cascading deletion', async db => {
    await db.exec(seed);
    await db.exec(`alter table gamma.players add foreign key(user_id) references auth.users(id) on delete cascade; insert into gamma.players values('${existing}','${actor}')`);
    const before = await snapshot(db);
    await assert.rejects(db.exec(cleanup), /dependent history/); await db.exec('rollback');
    assert.deepEqual(await snapshot(db), before);
  }],
  ['mid-transaction contact constraint failure rolls back the earlier principals', async db => {
    await db.exec("alter table jfl_private.player_contacts add constraint reject_fifth_fixture check(phone <> '+12065550135')");
    const before = await snapshot(db);
    await assert.rejects(db.exec(seed), /reject_fifth_fixture/); await db.exec('rollback');
    assert.deepEqual(await snapshot(db), before);
  }],
  ['original-history hash guard rolls back principals and an unexpected prior-row edit', async db => {
    await db.exec(`insert into jfl.teams values('${existing}','original team history')`);
    const before = await snapshot(db);
    const hook = seed.lastIndexOf('  for history_table in select');
    assert.ok(hook > 0);
    const injected = seed.slice(0,hook) + `  update jfl.teams set payload='unexpected change' where id='${existing}';\n` + seed.slice(hook);
    await assert.rejects(db.exec(injected), /Original JFL history changed/); await db.exec('rollback');
    assert.deepEqual(await snapshot(db), before);
  }],
  ['cleanup refuses changed fixture contact or rating', async db => {
    await db.exec(seed); await db.exec(`update jfl.player_ratings set fargo_rating=550 where player_id='${player}'`);
    const before = await snapshot(db);
    await assert.rejects(db.exec(cleanup), /Exact complete unused/); await db.exec('rollback');
    assert.deepEqual(await snapshot(db), before);
  }],
];

for (const [name, run] of cases) {
  const db = new PGlite();
  try { await db.exec(schema); await run(db); console.log(`PASS: ${name}`); }
  catch (error) { console.error(`FAIL: ${name}: ${error.message}\n${error.where || ''}\n${error.internalQuery || ''}`); process.exitCode = 1; break; }
  finally { await db.close(); }
}
if (!process.exitCode) console.log(`PASS: ${cases.length} local PostgreSQL fixture checks; no hosted writes.`);
