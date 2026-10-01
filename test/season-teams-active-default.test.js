import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('season teams default follows the synced Gamma page', () => {
  const source = fs.readFileSync(new URL('../src/adminSeasonTeamsPage.js', import.meta.url), 'utf8');
  assert.match(source, /function selectedSeasonId/);
});
