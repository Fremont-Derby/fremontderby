import test from 'node:test';
import assert from 'node:assert/strict';
import { probeHtml, probeJson } from '../scripts/assert-public-surface.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('probeJson accepts healthy /health payload', async () => {
  const result = await probeJson(
    'https://fremontderby.com',
    '/health',
    'production',
    async () => json({ ok: true, service: 'fremontderby' }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
});

test('probeJson rejects non-JSON body', async () => {
  const result = await probeJson(
    'https://fremontderby.com',
    '/health',
    'production',
    async () => new Response('<html>nope</html>', { status: 200 }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'non-JSON');
});

test('probeJson requires matching environment on /health/environment', async () => {
  const result = await probeJson(
    'https://dru.fremontderby.com',
    '/health/environment',
    'dru',
    async () => json({ ok: true, environment: 'production' }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /expected="dru"/);
});

test('probeHtml accepts shell with doctype and brand markers', async () => {
  const html =
    '<!doctype html><html><head><meta name="viewport" content="width=device-width">' +
    '<title>Fremont Derby</title></head><body>fremont</body></html>';
  const result = await probeHtml('https://fremontderby.com', '/', async () => new Response(html, { status: 200 }));
  assert.equal(result.ok, true);
});

test('probeHtml fails when shell markers are missing', async () => {
  // Both attempts return the same weak shell; expect failure after retry.
  const result = await probeHtml(
    'https://fremontderby.com',
    '/',
    async () => new Response('<html>nope</html>', { status: 200 }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /shell markers/i);
});
