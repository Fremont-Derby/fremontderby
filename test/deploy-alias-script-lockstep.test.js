import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('deploy and deploy:production both point at deploy-production.mjs', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.deploy, 'node scripts/deploy-production.mjs');
  assert.equal(pkg.scripts['deploy:production'], 'node scripts/deploy-production.mjs');
});
