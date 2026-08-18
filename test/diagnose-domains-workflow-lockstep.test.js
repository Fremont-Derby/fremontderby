import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('diagnose-worker-domains is workflow_dispatch only', () => {
  const yml = readFileSync('.github/workflows/diagnose-worker-domains.yml', 'utf8');
  assert.match(yml, /workflow_dispatch:/);
  assert.doesNotMatch(yml, /pull_request:/);
  assert.doesNotMatch(yml, /schedule:/);
  assert.match(yml, /diagnose-worker-domains\.mjs/);
});
