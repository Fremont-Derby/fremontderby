import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase/migrations/20260816234000_returning_slot_trade_prechecks.sql'), 'utf8');
test('returning slot and trade prechecks present', () => {
  assert.match(sql, /respond_to_returning_team_slot/);
  assert.match(sql, /That team name is already used in this season/);
  assert.match(sql, /Player already has an active team membership/);
  assert.match(sql, /complete_team_trade_if_ready/);
  assert.match(sql, /Trade blocked: player still has an active team membership/);
});
