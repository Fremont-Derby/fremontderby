import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('canary sub-scripts point at assert scripts', () => {
  assert.equal(pkg.scripts['canary:dns'], 'node scripts/assert-production-dns.mjs');
  assert.equal(pkg.scripts['canary:surface'], 'node scripts/assert-public-surface.mjs');
  assert.equal(pkg.scripts['canary:lanes'], 'node scripts/assert-lane-health.mjs');
});

test('canary aggregate chains dns + lanes + surface', () => {
  assert.match(pkg.scripts.canary, /assert-production-dns\.mjs/);
  assert.match(pkg.scripts.canary, /assert-lane-health\.mjs/);
  assert.match(pkg.scripts.canary, /assert-public-surface\.mjs/);
});
