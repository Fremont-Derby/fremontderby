import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseSourcePolicy } from '../scripts/check-release-source-policy.mjs';

test('main blocks forks; allows same-repo transitional non-DRU heads', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'fremontderby-gamma' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'grok/x' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'grok/x', isFork: true }).ok, false);
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'main', head: 'grok/x', strict: true }).ok,
    false,
  );
});

test('DRU can never be a Gamma or production promotion source', () => {
  for (const head of ['dru/issue-2-y', 'fremontderby-dru']) {
    assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head }).ok, false);
    assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head }).ok, false);
  }
});

test('gamma accepts JFL promotion sources only', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/issue-1-x' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'fremontderby-jfl' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'feature/random' }).ok, false);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/x', isFork: true }).ok, false);
});

test('non-release bases remain outside this check', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-jfl', head: 'dru/issue-2-y' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-dru', head: 'dru/issue-2-y' }).ok, true);
});
