import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('canary scripts chain dns lanes and surface', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['canary:dns'], 'node scripts/assert-production-dns.mjs');
  assert.equal(pkg.scripts['canary:lanes'], 'node scripts/assert-lane-health.mjs');
  assert.equal(pkg.scripts['canary:surface'], 'node scripts/assert-public-surface.mjs');
  assert.equal(
    pkg.scripts.canary,
    'node scripts/assert-production-dns.mjs && node scripts/assert-lane-health.mjs && node scripts/assert-public-surface.mjs',
  );
});
