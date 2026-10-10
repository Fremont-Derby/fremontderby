import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production deploy tags from GITHUB_SHA outside Workers CI', () => {
  const src = readFileSync(new URL('../scripts/deploy-production.mjs', import.meta.url), 'utf8');
  assert.match(src, /assertProductionDeployContext/);
});
