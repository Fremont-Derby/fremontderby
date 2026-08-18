import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('runProductionDeploy stamps identity before wrangler deploy', () => {
  const source = readFileSync('scripts/deploy-production.mjs', 'utf8');
  const stampIdx = source.indexOf('scripts/stamp-deploy-identity.mjs');
  const deployArgsIdx = source.indexOf('productionDeployArgs');
  assert.ok(stampIdx > 0);
  assert.ok(deployArgsIdx > stampIdx, 'stamp must precede productionDeployArgs usage in runProductionDeploy');
});

test('deploy-production never passes empty --env', () => {
  const source = readFileSync('scripts/deploy-production.mjs', 'utf8');
  assert.match(source, /Do not pass --env ""/);
  assert.doesNotMatch(source, /--env\s+['"]['"]/);
});
