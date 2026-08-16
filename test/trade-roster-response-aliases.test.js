import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/index.js'), 'utf8');
test('trade respond and roster availability use aliases', () => {
  assert.match(src, /function normalizeApproveDecline/);
  assert.match(src, /respondToTeamTradePlayerCommand\([\s\S]*normalizeApproveDecline/);
  assert.match(src, /approveTeamTradeCaptainCommand\([\s\S]*normalizeApproveDecline/);
  assert.match(src, /body\.availability_status/);
});
