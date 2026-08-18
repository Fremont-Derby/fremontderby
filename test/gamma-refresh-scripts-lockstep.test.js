import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('gamma refresh scripts map to gamma-prod-refresh.mjs', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['gamma:refresh:dry'], 'node scripts/gamma-prod-refresh.mjs');
  assert.equal(pkg.scripts['gamma:refresh'], 'GAMMA_REFRESH_EXECUTE=1 node scripts/gamma-prod-refresh.mjs');
});
