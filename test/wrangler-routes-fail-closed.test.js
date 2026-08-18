import test from 'node:test';
import assert from 'node:assert/strict';
import { assertWranglerRoutesCoverDomains } from '../scripts/lane-custom-domains.mjs';

test('assertWranglerRoutesCoverDomains throws when production routes are missing', () => {
  assert.throws(
    () => assertWranglerRoutesCoverDomains({ routes: [], env: {} }),
    /wrangler routes missing custom_domain for:.*fremontderby\.com/,
  );
});

test('assertWranglerRoutesCoverDomains throws when a lane route is missing', () => {
  const config = {
    routes: [
      { pattern: 'fremontderby.com', custom_domain: true },
      { pattern: 'www.fremontderby.com', custom_domain: true },
    ],
    env: {
      dru: { routes: [] },
      jfl: { routes: [{ pattern: 'jfl.fremontderby.com', custom_domain: true }] },
      gamma: { routes: [{ pattern: 'gamma.fremontderby.com', custom_domain: true }] },
    },
  };
  assert.throws(
    () => assertWranglerRoutesCoverDomains(config),
    /dru\.fremontderby\.com/,
  );
});

test('assertWranglerRoutesCoverDomains accepts a complete route map', () => {
  const config = {
    routes: [
      { pattern: 'fremontderby.com', custom_domain: true },
      { pattern: 'www.fremontderby.com', custom_domain: true },
    ],
    env: {
      dru: { routes: [{ pattern: 'dru.fremontderby.com', custom_domain: true }] },
      jfl: { routes: [{ pattern: 'jfl.fremontderby.com', custom_domain: true }] },
      gamma: { routes: [{ pattern: 'gamma.fremontderby.com', custom_domain: true }] },
    },
  };
  assert.equal(assertWranglerRoutesCoverDomains(config), true);
});
