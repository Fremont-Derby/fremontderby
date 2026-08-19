import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const scripts = pkg.scripts || {};

test('package canary script composes the three surface assert scripts in order', () => {
  const canary = scripts.canary || '';
  assert.ok(canary.includes('assert-production-dns.mjs'), 'canary must run production DNS assert');
  assert.ok(canary.includes('assert-lane-health.mjs'), 'canary must run lane health assert');
  assert.ok(canary.includes('assert-public-surface.mjs'), 'canary must run public surface assert');
  // Order matters for early-fail diagnostics.
  const dnsIdx = canary.indexOf('assert-production-dns.mjs');
  const laneIdx = canary.indexOf('assert-lane-health.mjs');
  const surfaceIdx = canary.indexOf('assert-public-surface.mjs');
  assert.ok(dnsIdx < laneIdx && laneIdx < surfaceIdx, 'canary composition order: dns → lanes → surface');
});

test('package canary:dns / canary:lanes / canary:surface are the individual assert entry points', () => {
  assert.equal(scripts['canary:dns'], 'node scripts/assert-production-dns.mjs');
  assert.equal(scripts['canary:lanes'], 'node scripts/assert-lane-health.mjs');
  assert.equal(scripts['canary:surface'], 'node scripts/assert-public-surface.mjs');
});

test('package canary:contract runs the pure contract tests only', () => {
  const contract = scripts['canary:contract'] || '';
  assert.ok(contract.includes('node --test'));
  assert.ok(contract.includes('public-surface-contract.test.js'));
  assert.ok(contract.includes('assert-production-dns.test.js'));
});

test('package validate:gamma-rc and labels:check point at the intended scripts', () => {
  assert.equal(scripts['validate:gamma-rc'], 'node scripts/validate-gamma-rc.mjs');
  assert.equal(scripts['labels:check'], 'node scripts/collaboration-labels.mjs --check');
});

test('package gamma refresh scripts are present and dry-run is the default safe entry', () => {
  assert.equal(scripts['gamma:refresh:dry'], 'node scripts/gamma-prod-refresh.mjs');
  assert.ok(
    (scripts['gamma:refresh'] || '').includes('GAMMA_REFRESH_EXECUTE=1'),
    'execute path must set GAMMA_REFRESH_EXECUTE=1',
  );
});

test('do-work:check composes canary:contract then canary', () => {
  const check = scripts['do-work:check'] || '';
  assert.ok(check.includes('canary:contract'));
  assert.ok(check.includes('canary'));
  assert.ok(check.indexOf('canary:contract') < check.indexOf('canary'));
});
