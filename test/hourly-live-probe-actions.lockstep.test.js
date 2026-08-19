import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION_PROBE_ENV_KEYS,
  ACTION_PROBE_PATHS,
  resolveActionProbeHosts,
  isProbeHttpOk,
  runActionLiveProbes,
} from '../scripts/hourly-live-probe.mjs';

test('ACTION_PROBE_PATHS covers public pages plus health endpoints', () => {
  for (const path of ['/', '/schedule', '/teams', '/admin', '/health', '/health/environment']) {
    assert.ok(ACTION_PROBE_PATHS.includes(path), path);
  }
  assert.equal(Object.isFrozen(ACTION_PROBE_PATHS), true);
  assert.deepEqual([...ACTION_PROBE_ENV_KEYS], [
    'PROBE_HOST',
    'PROBE_WWW',
    'PROBE_DRU',
    'PROBE_JFL',
    'PROBE_GAMMA',
  ]);
});

test('resolveActionProbeHosts strips trailing slashes and drops empty env', () => {
  assert.deepEqual(
    resolveActionProbeHosts({
      PROBE_HOST: 'https://fremontderby.com/',
      PROBE_DRU: 'https://dru.fremontderby.com',
      PROBE_WWW: '',
    }),
    ['https://fremontderby.com', 'https://dru.fremontderby.com'],
  );
  assert.deepEqual(resolveActionProbeHosts({}), []);
});

test('isProbeHttpOk accepts 2xx/3xx only', () => {
  assert.equal(isProbeHttpOk(200), true);
  assert.equal(isProbeHttpOk(302), true);
  assert.equal(isProbeHttpOk(399), true);
  assert.equal(isProbeHttpOk(400), false);
  assert.equal(isProbeHttpOk(500), false);
  assert.equal(isProbeHttpOk(0), false);
});

test('runActionLiveProbes fails closed when no hosts configured', async () => {
  const summary = await runActionLiveProbes({ hosts: [] });
  assert.equal(summary.failures, 1);
  assert.match(summary.error, /No PROBE_\* hosts/);
});

test('runActionLiveProbes counts HTTP and transport failures with injected fetch', async () => {
  const summary = await runActionLiveProbes({
    hosts: ['https://example.test'],
    paths: ['/health', '/boom'],
    fetchImpl: async (url) => {
      if (url.endsWith('/health')) return new Response('ok', { status: 200 });
      if (url.endsWith('/boom')) return new Response('nope', { status: 503 });
      throw new Error(`unexpected ${url}`);
    },
  });
  assert.equal(summary.failures, 1);
  assert.equal(summary.results.length, 2);
  assert.equal(summary.results[0].ok, true);
  assert.equal(summary.results[1].ok, false);
  assert.equal(summary.results[1].status, 503);
});

test('runActionLiveProbes records fetch throws as failures', async () => {
  const summary = await runActionLiveProbes({
    hosts: ['https://example.test'],
    paths: ['/'],
    fetchImpl: async () => {
      throw new Error('network down');
    },
  });
  assert.equal(summary.failures, 1);
  assert.equal(summary.results[0].ok, false);
  assert.match(summary.results[0].error, /network down/);
});
