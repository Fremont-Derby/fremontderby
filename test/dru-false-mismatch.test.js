import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('a one-sided rack waits instead of claiming a mismatch', () => {
  const source = readFileSync(new URL('../src/rackLedgerScorecard.js', import.meta.url), 'utf8');
  assert.match(source, /bothSides\?'Mismatch at rack '/);
  assert.match(source, /Waiting for the other team/);
});
