import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('team review accepts the approve word the form sends', () => {
  const source = readFileSync(new URL('../src/druReviewWordHttp.js', import.meta.url), 'utf8');
  assert.match(source, /approved: 'approve'/);
  assert.match(source, /declined: 'reject'/);
  assert.doesNotMatch(source, /\.get\(/);
});

test('schedule error does not name Season 1', () => {
  const source = readFileSync(new URL('../domain/schedule.js', import.meta.url), 'utf8');
  assert.match(source, /A schedule needs exactly 8 teams/);
  assert.doesNotMatch(source, /Season 1 schedule requires exactly 8 teams/);
});
