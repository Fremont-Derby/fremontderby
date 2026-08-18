import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('staging-readiness is workflow_dispatch and smokes staging environment', () => {
  const yml = readFileSync('.github/workflows/staging-readiness.yml', 'utf8');
  assert.match(yml, /workflow_dispatch:/);
  assert.match(yml, /smoke-release\.mjs/);
  assert.match(yml, /"\$STAGING_BASE_URL" staging/);
});
