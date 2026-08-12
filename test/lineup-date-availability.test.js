import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260812043500_lineup_date_availability_bridge.sql',
  import.meta.url,
);

async function migrationSql() {
  return readFile(migrationUrl, 'utf8');
}

function captainReadModel(sql) {
  const marker = 'drop function if exists public.list_team_round_availability(uuid, uuid, uuid);';
  const start = sql.lastIndexOf(marker);
  assert.notEqual(start, -1, 'captain availability read model must be replaced');
  return sql.slice(start);
}

test('captain lineup availability is keyed by the selected round scheduled date', async () => {
  const sql = await migrationSql();
  const readModel = captainReadModel(sql);

  assert.match(readModel, /target_round\.scheduled_on/i);
  assert.match(readModel, /private\.player_date_availability/i);
  assert.match(
    readModel,
    /availability\.availability_date\s*=\s*target_round\.scheduled_on/i,
  );
  assert.match(
    readModel,
    /coalesce\(availability\.status,\s*'unsure'::text\)\s+as availability_status/i,
  );

  assert.doesNotMatch(readModel, /private\.roster_availability/i);
  assert.doesNotMatch(readModel, /private\.free_agent_availability/i);
});

test('available substitutes come from active season players rather than team membership', async () => {
  const readModel = captainReadModel(await migrationSql());

  assert.match(readModel, /from public\.season_players sp/i);
  assert.match(readModel, /sp\.status\s*=\s*'active'/i);
  assert.match(readModel, /availability\.status\s*=\s*'available'/i);
  assert.match(readModel, /'substitute'::text/i);
  assert.match(readModel, /not exists[\s\S]*own_membership\.team_id\s*=\s*target_team_id/i);
});

test('legacy round setters delegate to date availability instead of creating a second answer', async () => {
  const sql = await migrationSql();

  const delegatedCalls = sql.match(/perform \* from public\.set_own_date_availability\(/gi) || [];
  assert.equal(delegatedCalls.length, 2);
  assert.match(sql, /target_round\.scheduled_on/i);
  assert.match(sql, /Legacy roster setter/i);
  assert.match(sql, /Legacy free-agent setter/i);
});

test('date writes keep the temporary lineup-submit compatibility cache synchronized', async () => {
  const sql = await migrationSql();

  assert.match(
    sql,
    /insert into private\.free_agent_availability[\s\S]*r\.scheduled_on\s*=\s*target_availability_date/i,
  );
  assert.match(
    sql,
    /update private\.roster_availability ra[\s\S]*r\.scheduled_on\s*=\s*target_availability_date/i,
  );
  assert.match(
    sql,
    /coalesce\([\s\S]*pda\.status[\s\S]*'unsure'\)/i,
  );
});

test('captain picker preserves payment, seven-match, and matchup-choice blockers', async () => {
  const readModel = captainReadModel(await migrationSql());

  assert.match(readModel, /Payment required before playing/i);
  assert.match(readModel, /Season limit reached \(7\/7\)/i);
  assert.match(readModel, /Already committed in this matchup/i);
  assert.match(readModel, /Player must choose a team for this matchup/i);
  assert.match(readModel, /Playing for the opponent in this matchup/i);
});
