import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('standings deep-link players and teams', () => {
  const src = readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderStandingsPage/);
  assert.match(src, /href="\/standings"/);
  assert.match(src, /href="\/teams"/);
});
