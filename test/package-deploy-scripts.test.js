import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

test('package.json exposes lane-specific deploy entrypoints for Workers Builds (#1192)', () => {
  assert.equal(pkg.scripts['deploy:production'], 'node scripts/deploy-production.mjs');
  assert.equal(pkg.scripts['deploy:jfl'], 'node scripts/deploy-lane.mjs jfl');
  assert.equal(pkg.scripts['deploy:dru'], 'node scripts/deploy-lane.mjs dru');
  assert.equal(pkg.scripts['deploy:gamma'], 'node scripts/deploy-lane.mjs gamma');
  assert.equal(pkg.scripts.prebuild, 'node scripts/guard-cloudflare-build.mjs');
  // Generic deploy must remain production-only on main (not a lane router).
  assert.match(pkg.scripts.deploy, /deploy-production/);
});
