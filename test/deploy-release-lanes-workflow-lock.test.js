import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/deploy-release-lanes.yml', import.meta.url),
  'utf8',
);

test('deploy-release-lanes workflow name and lane deploy invocation', () => {
  assert.match(workflow, /^name:\s*Deploy release lanes\s*$/m);
  assert.match(workflow, /npm run deploy:\$\{\{ matrix\.lane \}\}/);
});

test('deploy-release-lanes re-diagnoses domains after deploy', () => {
  assert.match(workflow, /diagnose-worker-domains\.mjs/);
});
