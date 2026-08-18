import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const scripts = pkg.scripts || {};

test('canary DNS/lane/surface scripts point at the assert entrypoints', () => {
  assert.equal(scripts['canary:dns'], 'node scripts/assert-production-dns.mjs');
  assert.equal(scripts['canary:lanes'], 'node scripts/assert-lane-health.mjs');
  assert.equal(scripts['canary:surface'], 'node scripts/assert-public-surface.mjs');
});

test('canary composite runs DNS then lane health then public surface', () => {
  assert.equal(
    scripts.canary,
    'node scripts/assert-production-dns.mjs && node scripts/assert-lane-health.mjs && node scripts/assert-public-surface.mjs',
  );
});

test('canary:contract runs the offline host contract tests', () => {
  assert.match(scripts['canary:contract'], /test\/public-surface-contract\.test\.js/);
  assert.match(scripts['canary:contract'], /test\/assert-production-dns\.test\.js/);
});
