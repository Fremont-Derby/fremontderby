import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/check-pr-card-contract.mjs', import.meta.url), 'utf8');

test('pr-card-contract defines AUTO_CLOSE_REFERENCE', () => {
  assert.ok(source.includes('AUTO_CLOSE_REFERENCE'));
  assert.ok(source.includes('close[sd]?'));
  assert.ok(source.includes('resolve[sd]?'));
  assert.ok(source.includes('fix(?:e[sd])?'));
});

test('pr-card-contract keeps cards open through post-merge verification', () => {
  assert.ok(source.includes('keep the card open through post-merge verification'));
});
