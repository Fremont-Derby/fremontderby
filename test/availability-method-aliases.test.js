import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('roster availability accepts POST and team-scoped PUT', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /rosterAvailabilityMatch[\s\S]*?POST/);
  assert.match(src, /teamRoundAvailabilityMatch[\s\S]*?handleSetRosterAvailabilityRequest/);
  assert.match(src, /roster\.availability_set/);
});
