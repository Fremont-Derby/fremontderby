import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseSourcePolicy } from '../scripts/check-release-source-policy.mjs';

test('non-strict main allows same-repo non-gamma with transitional notice', () => {
  const result = evaluateReleaseSourcePolicy({
    base: 'main',
    head: 'dru/issue-1',
    strict: false,
  });
  assert.equal(result.ok, true);
  assert.ok(result.notices.some((n) => /Transitional/.test(n)));
});

test('non-strict main from gamma has no transitional notice', () => {
  const result = evaluateReleaseSourcePolicy({
    base: 'main',
    head: 'fremontderby-gamma',
    strict: false,
  });
  assert.equal(result.ok, true);
  assert.equal(result.notices.length, 0);
});
