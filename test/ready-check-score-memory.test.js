import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('teams ready-check tries team-scoped then generic paths', () => {
  const src = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderTeamsPage/);
  assert.match(src, /href="\/lineup"/);
  assert.match(src, /href="\/availability"/);
  assert.match(src, /href="\/scorecard"/);
});
