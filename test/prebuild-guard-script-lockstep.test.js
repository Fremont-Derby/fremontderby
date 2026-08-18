import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('prebuild runs guard-cloudflare-build.mjs', () => {
  assert.equal(pkg.scripts.prebuild, 'node scripts/guard-cloudflare-build.mjs');
});
