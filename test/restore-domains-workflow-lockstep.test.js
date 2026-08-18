import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('restore-lane-custom-domains is workflow_dispatch with restore diagnose dns chain', () => {
  const yml = readFileSync('.github/workflows/restore-lane-custom-domains.yml', 'utf8');
  assert.match(yml, /workflow_dispatch:/);
  assert.doesNotMatch(yml, /pull_request:/);
  assert.match(yml, /restore-lane-custom-domains\.mjs/);
  assert.match(yml, /diagnose-worker-domains\.mjs/);
  assert.match(yml, /assert-production-dns\.mjs/);
});
