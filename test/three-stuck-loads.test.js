import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('stuck loads leave a finished sentence', () => {
  const checkin = readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  const seasons = readFileSync(new URL('../src/adminSeasonsPage.js', import.meta.url), 'utf8');
  const score = readFileSync(new URL('../src/scorecardScriptRepair.js', import.meta.url), 'utf8');
  assert.match(checkin, /Check-in took too long/);
  assert.match(seasons, /Seasons took too long/);
  assert.match(score, /startsWith\('<'\)/);
});
