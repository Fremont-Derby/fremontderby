import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const publishRetryMigration = new URL(
  '../supabase/migrations/20260813034500_publish_schedule_retry_safety.sql',
  import.meta.url,
);
const closeMigration = new URL(
  '../supabase/migrations/20260812095000_explicit_season_close.sql',
  import.meta.url,
);

function indexOfOrFail(source, pattern, label) {
  const index = source.search(pattern);
  assert.notEqual(index, -1, `${label} must be present`);
  return index;
}

test('Publish schedule serializes competing submits and returns only a complete persisted retry', async () => {
  const sql = await readFile(publishRetryMigration, 'utf8');

  const rowLock = indexOfOrFail(sql, /from public\.seasons s where s\.id = target_season_id for update/i, 'season row lock');
  const activeRetry = indexOfOrFail(sql, /if current_status = 'active' then/i, 'active retry branch');
  const persistedRoundCount = indexOfOrFail(sql, /select count\(\*\)::integer into existing_round_count[\s\S]*from public\.rounds/i, 'persisted round count');
  const persistedMatchCount = indexOfOrFail(sql, /select count\(\*\)::integer into existing_match_count[\s\S]*from public\.team_matches/i, 'persisted team-match count');
  const completenessGuard = indexOfOrFail(sql, /existing_round_count <> 7 or existing_match_count <> 28/i, 'complete schedule guard');
  const firstWrite = indexOfOrFail(sql, /update public\.seasons set status = 'active'/i, 'first publication write');
  const auditWrite = indexOfOrFail(sql, /'season\.publish_schedule'/i, 'publication audit');

  assert.ok(rowLock < activeRetry, 'the season row is locked before deciding whether this is a retry');
  assert.ok(activeRetry < persistedRoundCount && persistedRoundCount < completenessGuard);
  assert.ok(activeRetry < persistedMatchCount && persistedMatchCount < completenessGuard);
  assert.ok(completenessGuard < firstWrite, 'retry verification occurs before any publication mutation');
  assert.ok(firstWrite < auditWrite, 'only a first publication reaches the audit write');
  assert.match(sql, /round_count := existing_round_count;[\s\S]*team_match_count := existing_match_count;[\s\S]*return next;[\s\S]*return;/i);
  assert.match(sql, /raise exception 'Active season schedule is incomplete'/i);
  assert.match(sql, /revoke all on function public\.publish_season_schedule\(uuid, uuid, text, jsonb\)[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.publish_season_schedule\(uuid, uuid, text, jsonb\)[\s\S]*to service_role/i);
});

test('Close season serializes competing submits and does not duplicate the close audit on retry', async () => {
  const sql = await readFile(closeMigration, 'utf8');

  const rowLock = indexOfOrFail(sql, /from public\.seasons s[\s\S]*where s\.id = target_season_id[\s\S]*for update/i, 'season close row lock');
  const readinessRead = indexOfOrFail(sql, /from public\.get_season_close_readiness\(actor_user_id, target_season_id\)/i, 'close readiness read');
  const completeRetry = indexOfOrFail(sql, /if readiness\.season_status = 'complete' then/i, 'complete retry branch');
  const closeWrite = indexOfOrFail(sql, /update public\.seasons[\s\S]*set status = 'complete'/i, 'close status write');
  const auditWrite = indexOfOrFail(sql, /'season\.close'/i, 'close audit');

  assert.ok(rowLock < readinessRead, 'close locks the season before recomputing readiness');
  assert.ok(readinessRead < completeRetry, 'retry decision uses post-lock season state');
  assert.ok(completeRetry < closeWrite, 'already-complete retries return before mutating the season');
  assert.ok(closeWrite < auditWrite, 'only the first close reaches the audit write');
  assert.match(sql, /return query select target_season_id, 'complete'::text, effective_closed_at;[\s\S]*return;/i);
  assert.doesNotMatch(sql, /delete from public\.(seasons|rounds|team_matches|player_matches|player_match_racks)/i);
});
