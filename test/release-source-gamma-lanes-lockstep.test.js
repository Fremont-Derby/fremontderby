import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseSourcePolicy } from '../scripts/check-release-source-policy.mjs';

test('gamma accepts jfl/* and dru/* heads', () => {
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/issue-1' }).ok,
    true,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'dru/issue-2' }).ok,
    true,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'fremontderby-dru' }).ok,
    true,
  );
});

test('gamma rejects unrelated heads and forks', () => {
  const bad = evaluateReleaseSourcePolicy({
    base: 'fremontderby-gamma',
    head: 'feature/x',
  });
  assert.equal(bad.ok, false);
  const fork = evaluateReleaseSourcePolicy({
    base: 'fremontderby-gamma',
    head: 'dru/issue-1',
    isFork: true,
  });
  assert.equal(fork.ok, false);
});
