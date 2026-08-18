import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/check-pr-card-contract.mjs', import.meta.url), 'utf8');

test('pr-card-contract defines AUTO_CLOSE_REFERENCE', () => {
  assert.match(source, /AUTO_CLOSE_REFERENCE\s*=/);
  assert.match(source, /close\[sd\]\?/);
  assert.match(source, /fix\(?:e\[sd\]\)\?/);
  assert.match(source, /resolve\[sd\]\?/);
});

test('pr-card-contract keeps cards open through post-merge verification', () => {
  assert.match(
    source,
    /keep the card open through post-merge verification/i,
  );
});
