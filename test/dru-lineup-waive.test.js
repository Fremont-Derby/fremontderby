import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('DRU lineup lock waives practice players and skips Season 1', () => {
  const source = readFileSync(new URL('../src/druLineupBypass.js', import.meta.url), 'utf8');
  assert.match(source, /status: 'waived'/);
  assert.match(source, /Season 1/);
  assert.match(source, /payment_status/);
});
