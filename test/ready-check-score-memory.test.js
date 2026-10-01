import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('teams ready-check tries team-scoped then generic paths', () => {
  const src = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /\/api\/teams\/'?\+encodeURIComponent\(teamId\)/);
  assert.match(src, /\/api\/ready-checks/);
});

test('score picker remembers date and team', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /fd\.scoreDate/);
  assert.match(src, /fd\.scoreTeam/);
});
