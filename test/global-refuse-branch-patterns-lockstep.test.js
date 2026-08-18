import test from 'node:test';
import assert from 'node:assert/strict';
import { GLOBAL_REFUSE_BRANCH_PATTERNS } from '../scripts/guard-cloudflare-build.mjs';

test('GLOBAL_REFUSE_BRANCH_PATTERNS covers PR heads merges and bots', () => {
  assert.ok(GLOBAL_REFUSE_BRANCH_PATTERNS.some((re) => re.test('pull/12/head')));
  assert.ok(GLOBAL_REFUSE_BRANCH_PATTERNS.some((re) => re.test('pull/99/merge')));
  assert.ok(GLOBAL_REFUSE_BRANCH_PATTERNS.some((re) => re.test('refs/pull/1/head')));
  assert.ok(GLOBAL_REFUSE_BRANCH_PATTERNS.some((re) => re.test('dependabot/npm_and_yarn/x')));
  assert.ok(GLOBAL_REFUSE_BRANCH_PATTERNS.some((re) => re.test('renovate/lock-file')));
  assert.ok(!GLOBAL_REFUSE_BRANCH_PATTERNS.some((re) => re.test('fremontderby-dru')));
});
