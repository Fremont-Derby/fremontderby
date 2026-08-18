import test from 'node:test';
import assert from 'node:assert/strict';
import { probeJson } from '../scripts/assert-public-surface.mjs';

function mockFetch(status, body) {
  return async () => ({
    status,
    text: async () => JSON.stringify(body),
  });
}

test('probeJson /health requires ok true', async () => {
  const ok = await probeJson('https://example.com', '/health', null, mockFetch(200, { ok: true }));
  assert.equal(ok.ok, true);
  const bad = await probeJson('https://example.com', '/health', null, mockFetch(200, { ok: false }));
  assert.equal(bad.ok, false);
});

test('probeJson /health/environment requires matching expectEnv', async () => {
  const ok = await probeJson(
    'https://dru.example.com',
    '/health/environment',
    'dru',
    mockFetch(200, { environment: 'dru', ok: true }),
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.environment, 'dru');
  const mismatch = await probeJson(
    'https://dru.example.com',
    '/health/environment',
    'dru',
    mockFetch(200, { environment: 'jfl', ok: true }),
  );
  assert.equal(mismatch.ok, false);
});
