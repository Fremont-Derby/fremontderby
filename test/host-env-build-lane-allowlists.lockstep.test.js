import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  HOST_ENVIRONMENT_EXPECTATIONS,
  expectedEnvironmentForHost,
  normalizeRequestHost,
} from '../src/hostEnvironment.js';
import {
  LANE_BRANCH_ALLOWLISTS,
  GLOBAL_REFUSE_BRANCH_PATTERNS,
  branchAllowedForLane,
} from '../scripts/guard-cloudflare-build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('HOST_ENVIRONMENT_EXPECTATIONS exact public host map', () => {
  assert.deepEqual({ ...HOST_ENVIRONMENT_EXPECTATIONS }, {
    'fremontderby.com': 'production',
    'www.fremontderby.com': 'production',
    'jfl.fremontderby.com': 'jfl',
    'dru.fremontderby.com': 'dru',
    'gamma.fremontderby.com': 'gamma',
  });
});

test('normalizeRequestHost strips ports and lowercases', () => {
  assert.equal(normalizeRequestHost('WWW.FremontDerby.com:443'), 'www.fremontderby.com');
  assert.equal(normalizeRequestHost('  dru.fremontderby.com  '), 'dru.fremontderby.com');
  assert.equal(expectedEnvironmentForHost('WWW.fremontderby.com:443'), 'production');
  assert.equal(expectedEnvironmentForHost('unknown.example'), null);
});

test('LANE_BRANCH_ALLOWLISTS keep production on main and lanes namespaced', () => {
  assert.ok(Object.keys(LANE_BRANCH_ALLOWLISTS).sort().join(',') === 'dru,gamma,jfl,production');
  assert.equal(branchAllowedForLane('main', 'production'), true);
  assert.equal(branchAllowedForLane('fremontderby-jfl', 'jfl'), true);
  assert.equal(branchAllowedForLane('jfl/issue-1-x', 'jfl'), true);
  assert.equal(branchAllowedForLane('fremontderby-dru', 'dru'), true);
  assert.equal(branchAllowedForLane('dru/issue-1-x', 'dru'), true);
  assert.equal(branchAllowedForLane('fremontderby-gamma', 'gamma'), true);
  assert.equal(branchAllowedForLane('gamma/issue-1-x', 'gamma'), true);
  // Cross-lane and PR noise refused
  assert.equal(branchAllowedForLane('main', 'jfl'), false);
  assert.equal(branchAllowedForLane('jfl/issue-1-x', 'dru'), false);
  assert.equal(branchAllowedForLane('pull/12/head', 'production'), false);
  assert.equal(branchAllowedForLane('dependabot/npm-and-yarn/x', 'gamma'), false);
});

test('GLOBAL_REFUSE_BRANCH_PATTERNS cover PR and bot noise', () => {
  const samples = ['pull/99/head', 'pull/99/merge', 'refs/pull/1/head', 'dependabot/foo', 'renovate/bar'];
  for (const sample of samples) {
    assert.ok(
      GLOBAL_REFUSE_BRANCH_PATTERNS.some((re) => re.test(sample)),
      `${sample} must match a global refuse pattern`,
    );
  }
});

test('package stays ESM (type module)', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.private, true);
});
