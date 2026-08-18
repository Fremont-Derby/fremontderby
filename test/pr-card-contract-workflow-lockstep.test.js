import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pr-card-contract workflow job display name is pr-card-contract', () => {
  const yml = readFileSync('.github/workflows/pr-card-contract.yml', 'utf8');
  assert.match(yml, /name: PR card contract/);
  assert.match(yml, /name: pr-card-contract/);
  assert.match(yml, /node scripts\/check-pr-card-contract\.mjs/);
});

test('pr-card-contract requires open cards through post-merge verification', () => {
  const yml = readFileSync('.github/workflows/pr-card-contract.yml', 'utf8');
  assert.match(yml, /must remain open through post-merge verification/);
  assert.match(yml, /contents:\s*read/);
});
