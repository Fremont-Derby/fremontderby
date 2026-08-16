import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseSourcePolicy } from '../scripts/check-release-source-policy.mjs';

test('main blocks forks; allows same-repo transitional heads', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'fremontderby-gamma' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'grok/x' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'grok/x', isFork: true }).ok, false);
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'main', head: 'grok/x', strict: true }).ok,
    false,
  );
});

test('gamma accepts jfl/dru namespaces only', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/issue-1-x' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'dru/issue-2-y' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'feature/random' }).ok, false);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/x', isFork: true }).ok, false);
});

test('other bases are not restricted by this check', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-jfl', head: 'anything' }).ok, true);
});
