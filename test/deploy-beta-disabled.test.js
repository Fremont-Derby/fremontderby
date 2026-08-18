import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/deploy-beta.mjs', import.meta.url), 'utf8');

test('deploy-beta.mjs throws and does not invoke wrangler', () => {
  assert.match(source, /throw new Error/);
  assert.doesNotMatch(source, /wrangler\s+deploy/);
  assert.doesNotMatch(source, /spawnSync/);
});

test('deploy-beta.mjs points operators at lane deploy scripts', () => {
  assert.match(source, /deploy:jfl/);
  assert.match(source, /deploy:dru/);
});
