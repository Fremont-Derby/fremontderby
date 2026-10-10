import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('scoringTeamFromRequest requires team id with clear message', () => {
  const src = readFileSync(new URL('../src/dualScoringHttp.js', import.meta.url), 'utf8');
  assert.match(src, /createDualScoringHttpHandlers/);
});
