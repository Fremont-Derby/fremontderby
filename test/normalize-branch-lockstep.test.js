import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBranch } from '../scripts/check-release-source-policy.mjs';

test('normalizeBranch strips refs/heads/ and trims', () => {
  assert.equal(normalizeBranch('refs/heads/main'), 'main');
  assert.equal(normalizeBranch('  dru/issue-1  '), 'dru/issue-1');
  assert.equal(normalizeBranch(''), '');
});
