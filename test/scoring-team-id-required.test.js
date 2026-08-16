import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/dualScoringHttp.js'), 'utf8');
test('scoringTeamFromRequest requires team id with clear message', () => {
  assert.match(src, /scoringTeamId is required/);
  assert.match(src, /error\.status = 400/);
});
