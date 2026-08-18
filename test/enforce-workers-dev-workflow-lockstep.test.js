import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('enforce-workers-dev-disabled is workflow_dispatch only', () => {
  const yml = readFileSync('.github/workflows/enforce-workers-dev-disabled.yml', 'utf8');
  assert.match(yml, /workflow_dispatch:/);
  assert.doesNotMatch(yml, /pull_request:/);
  assert.doesNotMatch(yml, /schedule:/);
  assert.match(yml, /disable-workers-dev\.mjs/);
});
