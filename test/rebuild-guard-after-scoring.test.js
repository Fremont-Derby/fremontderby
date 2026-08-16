import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(
  join(root, 'supabase/migrations/20260816070000_guard_rebuild_after_scoring.sql'),
  'utf8',
);
const rpc = readFileSync(join(root, 'src/rpcErrorStatus.js'), 'utf8');

test('migration guards rebuild after scoring/racks', () => {
  assert.match(sql, /Cannot regenerate player matches after scoring/);
  assert.match(sql, /player_match_racks/);
  assert.match(sql, /in_progress.*finalized.*corrected/s);
});

test('RPC status maps regenerate-after-scoring to client-visible conflict class', () => {
  assert.match(rpc, /Cannot regenerate player matches after scoring/);
  assert.match(rpc, /Cannot regenerate player matches after racks have been recorded/);
});
