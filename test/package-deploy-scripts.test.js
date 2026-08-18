import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const scripts = pkg.scripts || {};

test('production deploy scripts invoke deploy-production.mjs', () => {
  assert.equal(scripts.deploy, 'node scripts/deploy-production.mjs');
  assert.equal(scripts['deploy:production'], 'node scripts/deploy-production.mjs');
});

test('lane deploy scripts invoke deploy-lane.mjs with the lane name', () => {
  assert.equal(scripts['deploy:jfl'], 'node scripts/deploy-lane.mjs jfl');
  assert.equal(scripts['deploy:dru'], 'node scripts/deploy-lane.mjs dru');
  assert.equal(scripts['deploy:gamma'], 'node scripts/deploy-lane.mjs gamma');
});

test('prebuild runs the Cloudflare build guard', () => {
  assert.equal(scripts.prebuild, 'node scripts/guard-cloudflare-build.mjs');
});
