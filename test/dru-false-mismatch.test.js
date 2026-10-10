import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('a one-sided rack waits instead of claiming a mismatch', () => {
  const src = readFileSync(new URL('../src/rackLedgerScorecard.js', import.meta.url), 'utf8');
  assert.match(src, /sharedRackLedgerScorecardStyles/);
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/schedule"/);
});
