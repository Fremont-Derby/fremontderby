import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { dualScoringHttpHandlers } from '../src/dualScoringHttp.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(
  join(root, 'supabase/migrations/20260816213000_reject_dual_team_scoring.sql'),
  'utf8',
);

test('migration rejects dual-team score tracker resolution', () => {
  assert.match(sql, /active on both teams in the matchup/);
  assert.match(sql, /match_tracker_for_scoring_team/);
});

test('HTTP maps dual-team scoring rejection to 403', async () => {
  assert.equal(typeof dualScoringHttpHandlers, 'object');
  const httpSrc = readFileSync(join(root, 'src/dualScoringHttp.js'), 'utf8');
  const mapperSrc = readFileSync(join(root, 'src/rpcErrorStatus.js'), 'utf8');
  assert.match(httpSrc, /rpcErrorStatus/);
  assert.match(mapperSrc, /active on both teams in the matchup/);
  assert.match(mapperSrc, /status: 403, re: \/active on both teams in the matchup/i);
});
