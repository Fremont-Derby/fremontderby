import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseSourcePolicy } from '../scripts/check-release-source-policy.mjs';

test('strict mode requires fremontderby-gamma into main', () => {
  const ok = evaluateReleaseSourcePolicy({
    base: 'main',
    head: 'fremontderby-gamma',
    strict: true,
  });
  assert.equal(ok.ok, true);

  const bad = evaluateReleaseSourcePolicy({
    base: 'main',
    head: 'dru/issue-1',
    strict: true,
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => /fremontderby-gamma/.test(e)));
});

test('forks cannot merge into main', () => {
  const result = evaluateReleaseSourcePolicy({
    base: 'main',
    head: 'fremontderby-gamma',
    isFork: true,
    strict: true,
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /Fork PRs cannot merge/.test(e)));
});
