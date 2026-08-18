import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/deploy-production.mjs', import.meta.url), 'utf8');

test('productionDeployArgs considers WORKERS_CI_COMMIT_SHA, GITHUB_SHA, and DEPLOY_GIT_SHA', () => {
  assert.match(source, /WORKERS_CI_COMMIT_SHA/);
  assert.match(source, /GITHUB_SHA/);
  assert.match(source, /DEPLOY_GIT_SHA/);
  assert.match(source, /--var/);
});
