import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

test('canary chains DNS, lane health, and public surface', () => {
  assert.match(scripts.canary, /assert-production-dns\.mjs/);
  assert.match(scripts.canary, /assert-lane-health\.mjs/);
  assert.match(scripts.canary, /assert-public-surface\.mjs/);
});

test('canary subscripts map to the correct scripts', () => {
  assert.equal(scripts['canary:dns'], 'node scripts/assert-production-dns.mjs');
  assert.equal(scripts['canary:lanes'], 'node scripts/assert-lane-health.mjs');
  assert.equal(scripts['canary:surface'], 'node scripts/assert-public-surface.mjs');
});
