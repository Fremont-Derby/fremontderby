import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUBLIC_HTML_PATHS,
  PUBLIC_JSON_PATHS,
  HTML_SHELL_MARKERS,
  CANARY_HOSTS,
} from '../scripts/public-surface-contract.mjs';

test('PUBLIC_HTML_PATHS stays frozen and covers core league surfaces', () => {
  assert.equal(Object.isFrozen(PUBLIC_HTML_PATHS), true);
  for (const path of [
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
  ]) {
    assert.ok(PUBLIC_HTML_PATHS.includes(path), path);
  }
  assert.equal(
    PUBLIC_HTML_PATHS.every((p) => typeof p === 'string' && p.startsWith('/')),
    true,
  );
});

test('PUBLIC_JSON_PATHS locks health endpoints only', () => {
  assert.deepEqual([...PUBLIC_JSON_PATHS], ['/health', '/health/environment']);
  assert.equal(Object.isFrozen(PUBLIC_JSON_PATHS), true);
});

test('HTML_SHELL_MARKERS require doctype, brand, and viewport', () => {
  assert.deepEqual([...HTML_SHELL_MARKERS], ['<!doctype html', 'fremont', 'viewport']);
  assert.equal(Object.isFrozen(HTML_SHELL_MARKERS), true);
});

test('CANARY_HOSTS covers production, www, and every lane with expectEnv', () => {
  assert.equal(Object.isFrozen(CANARY_HOSTS), true);
  const byName = Object.fromEntries(CANARY_HOSTS.map((h) => [h.name, h]));
  assert.equal(byName.production.base, 'https://fremontderby.com');
  assert.equal(byName.production.expectEnv, 'production');
  assert.equal(byName.www.base, 'https://www.fremontderby.com');
  assert.equal(byName.www.expectEnv, 'production');
  assert.equal(byName.gamma.base, 'https://gamma.fremontderby.com');
  assert.equal(byName.gamma.expectEnv, 'gamma');
  assert.equal(byName.dru.base, 'https://dru.fremontderby.com');
  assert.equal(byName.dru.expectEnv, 'dru');
  assert.equal(byName.jfl.base, 'https://jfl.fremontderby.com');
  assert.equal(byName.jfl.expectEnv, 'jfl');

  for (const host of CANARY_HOSTS) {
    assert.ok(host.base.startsWith('https://'));
    assert.ok(typeof host.expectEnv === 'string' && host.expectEnv.length > 0);
  }
});

test('lane canary hosts never expect production environment', () => {
  for (const host of CANARY_HOSTS.filter((h) => ['gamma', 'dru', 'jfl'].includes(h.name))) {
    assert.notEqual(host.expectEnv, 'production');
    assert.ok(host.base.includes(`${host.name}.fremontderby.com`));
  }
});
