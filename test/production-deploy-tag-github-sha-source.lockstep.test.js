import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'scripts/deploy-production.mjs'), 'utf8');

test('productionDeployArgs source considers GITHUB_SHA for tag path', () => {
  assert.ok(src.includes('GITHUB_SHA'));
  assert.ok(src.includes('WORKERS_CI_COMMIT_SHA') || src.includes('DEPLOY_GIT_SHA'));
  assert.ok(src.includes('--tag'));
  assert.ok(src.includes('DEPLOY_GIT_SHA:'));
});
