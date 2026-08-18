import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseSourcePolicy, normalizeBranch } from '../scripts/check-release-source-policy.mjs';

test('normalizeBranch strips refs/heads/', () => {
  assert.equal(normalizeBranch('refs/heads/fremontderby-gamma'), 'fremontderby-gamma');
  assert.equal(normalizeBranch('main'), 'main');
});

test('gamma accepts jfl/* and dru/* only', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'dru/foo' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/bar' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'feature/x' }).ok, false);
});

test('main blocks forks', () => {
  const result = evaluateReleaseSourcePolicy({ base: 'main', head: 'fremontderby-gamma', isFork: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /Fork PRs cannot merge directly into main/.test(e)));
});

test('strict main requires fremontderby-gamma', () => {
  const result = evaluateReleaseSourcePolicy({
    base: 'main',
    head: 'feature/x',
    strict: true,
  });
  assert.equal(result.ok, false);
});
