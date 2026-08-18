import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('production routes cover apex and www custom domains', () => {
  const cfg = loadWrangler();
  const patterns = (cfg.routes || []).map((r) => r.pattern).sort();
  assert.deepEqual(patterns, ['fremontderby.com', 'www.fremontderby.com']);
  for (const r of cfg.routes) {
    assert.equal(r.custom_domain, true);
  }
});

test('wrangler routes cover all LANE_CUSTOM_DOMAINS hostnames', () => {
  const cfg = loadWrangler();
  const covered = new Set([
    ...(cfg.routes || []).map((r) => r.pattern),
    ...Object.values(cfg.env || {}).flatMap((e) => (e.routes || []).map((r) => r.pattern)),
  ]);
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.ok(covered.has(row.hostname), `missing route for ${row.hostname}`);
  }
});
