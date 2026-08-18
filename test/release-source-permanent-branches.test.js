import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateReleaseSourcePolicy,
  normalizeBranch,
} from '../scripts/check-release-source-policy.mjs';

test('normalizeBranch strips refs/heads/ prefix', () => {
  assert.equal(normalizeBranch('refs/heads/main'), 'main');
  assert.equal(normalizeBranch('fremontderby-gamma'), 'fremontderby-gamma');
  assert.equal(normalizeBranch(''), '');
});

test('gamma accepts permanent fremontderby-jfl and fremontderby-dru heads', () => {
  assert.equal(
    evaluateReleaseSourcePolicy({
      base: 'fremontderby-gamma',
      head: 'fremontderby-jfl',
    }).ok,
    true,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({
      base: 'fremontderby-gamma',
      head: 'fremontderby-dru',
    }).ok,
    true,
  );
});

test('gamma rejects permanent-looking but untrusted heads', () => {
  assert.equal(
    evaluateReleaseSourcePolicy({
      base: 'fremontderby-gamma',
      head: 'fremontderby-staging',
    }).ok,
    false,
  );
});

test('strict main only allows fremontderby-gamma', () => {
  assert.equal(
    evaluateReleaseSourcePolicy({
      base: 'main',
      head: 'fremontderby-gamma',
      strict: true,
    }).ok,
    true,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({
      base: 'main',
      head: 'fremontderby-dru',
      strict: true,
    }).ok,
    false,
  );
});
