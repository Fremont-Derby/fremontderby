import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUBLIC_HTML_PATHS,
  PUBLIC_JSON_PATHS,
  HTML_SHELL_MARKERS,
  CANARY_HOSTS,
} from '../scripts/public-surface-contract.mjs';
import { LANE_HEALTH_CHECKS } from '../scripts/assert-lane-health.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('PUBLIC_HTML_PATHS inventory is complete and ordered', () => {
  assert.deepEqual([...PUBLIC_HTML_PATHS], [
    '/',
    '/standings',
    '/schedule',
    '/teams',
    '/scorecard',
    '/prizes',
    '/lineup',
    '/profile',
    '/availability',
    '/trades',
    '/admin',
    '/season-setup',
    '/playoffs',
    '/demo',
  ]);
});

test('PUBLIC_JSON_PATHS always includes health endpoints', () => {
  assert.ok(PUBLIC_JSON_PATHS.includes('/health'));
  assert.ok(PUBLIC_JSON_PATHS.includes('/health/environment'));
  assert.deepEqual([...PUBLIC_JSON_PATHS], ['/health', '/health/environment']);
});

test('HTML_SHELL_MARKERS require doctype + brand + viewport', () => {
  assert.deepEqual([...HTML_SHELL_MARKERS], ['<!doctype html', 'fremont', 'viewport']);
});

test('CANARY_HOSTS expectEnv matches HOST_ENVIRONMENT_EXPECTATIONS', () => {
  assert.ok(CANARY_HOSTS.length >= 5);
  for (const host of CANARY_HOSTS) {
    const hostname = host.base.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const expected = HOST_ENVIRONMENT_EXPECTATIONS[hostname];
    assert.ok(expected, `HOST_ENVIRONMENT_EXPECTATIONS missing ${hostname}`);
    assert.equal(host.expectEnv, expected, `${host.name} expectEnv must match host map`);
  }
});

test('LANE_HEALTH_CHECKS expect matches HOST_ENVIRONMENT_EXPECTATIONS', () => {
  assert.ok(LANE_HEALTH_CHECKS.length >= 5);
  for (const check of LANE_HEALTH_CHECKS) {
    const expected = HOST_ENVIRONMENT_EXPECTATIONS[check.host];
    assert.ok(expected, `HOST_ENVIRONMENT_EXPECTATIONS missing ${check.host}`);
    assert.equal(check.expect, expected, `${check.host} lane health expect must match host map`);
  }
});

test('every HOST_ENVIRONMENT_EXPECTATIONS host appears in at least one canary inventory', () => {
  const canaryHosts = new Set(
    CANARY_HOSTS.map((h) => h.base.replace(/^https?:\/\//, '').replace(/\/+$/, '')),
  );
  const laneHosts = new Set(LANE_HEALTH_CHECKS.map((c) => c.host));
  for (const hostname of Object.keys(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.ok(
      canaryHosts.has(hostname) || laneHosts.has(hostname),
      `${hostname} must appear in CANARY_HOSTS or LANE_HEALTH_CHECKS`,
    );
  }
});
