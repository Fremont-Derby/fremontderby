import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseSourcePolicy } from '../scripts/check-release-source-policy.mjs';

test('main only accepts fremontderby-gamma', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'fremontderby-gamma' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'jfl/issue-1-x' }).ok, false);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'main', head: 'fremontderby-gamma', isFork: true }).ok, false);
});

test('gamma accepts jfl/dru namespaces', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/issue-1-x' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'dru/issue-2-y' }).ok, true);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'feature/random' }).ok, false);
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/x', isFork: true }).ok, false);
});

test('other bases are not restricted by this check', () => {
  assert.equal(evaluateReleaseSourcePolicy({ base: 'fremontderby-jfl', head: 'anything' }).ok, true);
});
