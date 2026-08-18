import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const scripts = pkg.scripts || {};

test('prebuild runs Cloudflare build guard', () => {
  assert.equal(scripts.prebuild, 'node scripts/guard-cloudflare-build.mjs');
});

test('lane deploy scripts route through deploy-lane.mjs', () => {
  assert.equal(scripts['deploy:jfl'], 'node scripts/deploy-lane.mjs jfl');
  assert.equal(scripts['deploy:dru'], 'node scripts/deploy-lane.mjs dru');
  assert.equal(scripts['deploy:gamma'], 'node scripts/deploy-lane.mjs gamma');
});

test('production deploy script routes through deploy-production.mjs', () => {
  assert.equal(scripts['deploy:production'], 'node scripts/deploy-production.mjs');
  assert.equal(scripts.deploy, 'node scripts/deploy-production.mjs');
});
