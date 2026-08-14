import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import path from 'node:path';

const required = [
  'test/season1-complete-e2e.test.js',
  'test/regular-season-e2e.test.js',
  'test/environment-readiness.test.js',
  'test/beta-auth-bypass.test.js',
  'test/deploy-lane.test.js',
  'test/assert-lane-health.test.js',
  'test/release-smoke.test.js',
  'test/rack-ledger-scorecard.test.js',
  'test/two-device-scorecard-flow.test.js',
  'test/season-publish-readiness.test.js',
  'docs/SEASON1_TEST_CONTRACT.md',
];

test('season-1 confidence inventory files exist', async () => {
  for (const rel of required) {
    await access(path.resolve(rel));
  }
  assert.equal(required.length >= 10, true);
});
