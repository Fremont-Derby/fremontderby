import test from 'node:test';
import assert from 'node:assert/strict';
import {
  htmlShellOk,
  probeJson,
  probeHtml,
} from '../scripts/assert-public-surface.mjs';

test('htmlShellOk requires doctype + brand markers', () => {
  assert.equal(
    htmlShellOk('<!doctype html><meta name="viewport" content="width=device-width"><title>Fremont Derby</title>'),
    true,
  );
  assert.equal(htmlShellOk('<html>nope</html>'), false);
});

test('probeJson accepts healthy /health', async () => {
  const fetchImpl = async () => ({
    status: 200,
    text: async () => JSON.stringify({ ok: true, service: 'fremontderby' }),
  });
  const result = await probeJson('https://fremontderby.com', '/health', 'production', fetchImpl);
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
});

test('probeJson fails closed on non-JSON health body', async () => {
  const fetchImpl = async () => ({
    status: 200,
    text: async () => '<html>challenge</html>',
  });
  const result = await probeJson('https://fremontderby.com', '/health', 'production', fetchImpl);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'non-JSON');
});

test('probeJson requires matching /health/environment label', async () => {
  const fetchImpl = async () => ({
    status: 200,
    text: async () => JSON.stringify({ ok: true, environment: 'dru' }),
  });
  const ok = await probeJson('https://dru.fremontderby.com', '/health/environment', 'dru', fetchImpl);
  assert.equal(ok.ok, true);
  assert.equal(ok.environment, 'dru');

  const bad = await probeJson(
    'https://dru.fremontderby.com',
    '/health/environment',
    'dru',
    async () => ({
      status: 200,
      text: async () => JSON.stringify({ ok: true, environment: 'production' }),
    }),
  );
  assert.equal(bad.ok, false);
  assert.match(bad.error, /expected="dru"/);
});

test('probeHtml accepts a shell-complete HTML response', async () => {
  const fetchImpl = async () => ({
    status: 200,
    text: async () =>
      '<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Fremont Derby</title></head><body>ok</body></html>',
  });
  const result = await probeHtml('https://fremontderby.com', '/', fetchImpl);
  assert.equal(result.ok, true);
});

test('probeHtml fails when shell markers are missing on 200', async () => {
  const fetchImpl = async () => ({
    status: 200,
    text: async () => '<html><body>empty</body></html>',
  });
  const result = await probeHtml('https://fremontderby.com', '/', fetchImpl);
  assert.equal(result.ok, false);
  assert.match(result.error, /html shell markers missing/);
});
