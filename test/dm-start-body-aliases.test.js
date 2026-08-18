import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/chatHttp.js'), 'utf8');
test('start DM accepts snake_case and otherPlayerId aliases', () => {
  assert.match(src, /body\.seasonId \?\? body\.season_id/);
  assert.match(src, /body\.playerId \?\? body\.player_id \?\? body\.otherPlayerId/);
});
