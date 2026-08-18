import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('deploy lane scripts map to deploy-lane.mjs', () => {
  assert.equal(pkg.scripts['deploy:jfl'], 'node scripts/deploy-lane.mjs jfl');
  assert.equal(pkg.scripts['deploy:dru'], 'node scripts/deploy-lane.mjs dru');
  assert.equal(pkg.scripts['deploy:gamma'], 'node scripts/deploy-lane.mjs gamma');
});

test('production deploy scripts map to deploy-production.mjs', () => {
  assert.equal(pkg.scripts.deploy, 'node scripts/deploy-production.mjs');
  assert.equal(pkg.scripts['deploy:production'], 'node scripts/deploy-production.mjs');
});
