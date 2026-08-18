import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertWranglerRoutesCoverDomains } from '../scripts/lane-custom-domains.mjs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('assertWranglerRoutesCoverDomains passes current wrangler.jsonc', () => {
  assert.equal(assertWranglerRoutesCoverDomains(loadWrangler()), true);
});

test('assertWranglerRoutesCoverDomains fails when a lane route is missing', () => {
  const cfg = loadWrangler();
  cfg.env.dru.routes = [];
  assert.throws(
    () => assertWranglerRoutesCoverDomains(cfg),
    /wrangler routes missing custom_domain for: dru\.fremontderby\.com/,
  );
});
