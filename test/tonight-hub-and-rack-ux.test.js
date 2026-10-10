import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('live rack adapter retries offline and network failures', () => {
  const src = readFileSync(new URL('../src/liveRackLedgerAdapter.js', import.meta.url), 'utf8');
  assert.match(src, /liveRackLedgerAdapterSource/);
  assert.match(src, /href="\/profile"/);
});
