import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('stamp-deploy-identity reads GITHUB_SHA WORKERS_CI_COMMIT_SHA DEPLOY_GIT_SHA', () => {
  const source = readFileSync('scripts/stamp-deploy-identity.mjs', 'utf8');
  assert.match(source, /process\.env\.GITHUB_SHA/);
  assert.match(source, /process\.env\.WORKERS_CI_COMMIT_SHA/);
  assert.match(source, /process\.env\.DEPLOY_GIT_SHA/);
});

test('stamp-deploy-identity rewrites routerEntry STAMPED markers and clears .wrangler', () => {
  const source = readFileSync('scripts/stamp-deploy-identity.mjs', 'utf8');
  assert.match(source, /STAMPED_DEPLOY_GIT_SHA/);
  assert.match(source, /STAMPED_DEPLOY_AT/);
  assert.match(source, /src\/routerEntry\.js/);
  assert.match(source, /rmSync\('\.wrangler'/);
  assert.match(source, /src\/deployIdentity\.js/);
});
