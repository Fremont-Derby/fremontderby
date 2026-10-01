import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('roster shows Needs N and playoffs ready summary', () => {
  const src = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /Needs 1/);
  assert.match(src, /Playoffs ready/);
  assert.match(src, /playoffEligible/);
});
