import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveDeployIdentitySha } from '../scripts/stamp-deploy-identity.mjs';
import {
  assertCloudflareBuildContext,
  LANE_BRANCH_ALLOWLISTS,
} from '../scripts/guard-cloudflare-build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FULL = 'a'.repeat(40);
const SHORT = 'abcdef1';

test('resolveDeployIdentitySha prefers GITHUB_SHA then WORKERS_CI_COMMIT_SHA then DEPLOY_GIT_SHA', () => {
  assert.equal(
    resolveDeployIdentitySha({
      GITHUB_SHA: FULL,
      WORKERS_CI_COMMIT_SHA: 'b'.repeat(40),
      DEPLOY_GIT_SHA: 'c'.repeat(40),
    }),
    FULL,
  );
  assert.equal(
    resolveDeployIdentitySha({
      WORKERS_CI_COMMIT_SHA: FULL,
      DEPLOY_GIT_SHA: 'c'.repeat(40),
    }),
    FULL,
  );
  assert.equal(resolveDeployIdentitySha({ DEPLOY_GIT_SHA: FULL }), FULL);
  assert.equal(resolveDeployIdentitySha({ GITHUB_SHA: 'not-a-sha' }), null);
});

test('resolveDeployIdentitySha accepts short SHAs (>=7) and falls back to gitRevParse', () => {
  assert.equal(resolveDeployIdentitySha({ GITHUB_SHA: SHORT }), SHORT);
  assert.equal(
    resolveDeployIdentitySha({}, { gitRevParse: () => FULL }),
    FULL,
  );
  assert.equal(
    resolveDeployIdentitySha({}, { gitRevParse: () => 'nope' }),
    null,
  );
});

test('prebuild package script points at guard-cloudflare-build', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.prebuild, 'node scripts/guard-cloudflare-build.mjs');
  assert.ok(existsSync(join(root, 'scripts/guard-cloudflare-build.mjs')));
  assert.ok(Object.keys(LANE_BRANCH_ALLOWLISTS).includes('production'));
});

test('prebuild guard is a no-op outside Workers CI', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({}));
  assert.doesNotThrow(() => assertCloudflareBuildContext({ GITHUB_ACTIONS: 'true' }));
});

test('routerEntry keeps stamp markers consumed by stamp-deploy-identity', () => {
  const src = readFileSync(join(root, 'src/routerEntry.js'), 'utf8');
  assert.ok(src.includes('const STAMPED_DEPLOY_GIT_SHA'));
  assert.ok(src.includes('const STAMPED_DEPLOY_AT'));
});
