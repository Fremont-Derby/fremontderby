import test from 'node:test';
import assert from 'node:assert/strict';
import {
  htmlShellOk,
  probeJson,
  probeHtml,
} from '../scripts/assert-public-surface.mjs';
import { evaluateReleaseSourcePolicy } from '../scripts/check-release-source-policy.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('htmlShellOk requires doctype, fremont brand, and viewport', () => {
  assert.equal(
    htmlShellOk('<!doctype html><meta name="viewport" content="width=device-width"><title>Fremont Derby</title>'),
    true,
  );
  assert.equal(htmlShellOk('<!doctype html><title>Fremont Derby</title>'), false);
  assert.equal(htmlShellOk('<html>fremont viewport</html>'), false);
});

test('probeJson validates /health ok flag', async () => {
  const ok = await probeJson('https://example.test', '/health', null, async () =>
    jsonResponse({ ok: true, service: 'fremontderby' }),
  );
  assert.equal(ok.ok, true);

  const bad = await probeJson('https://example.test', '/health', null, async () =>
    jsonResponse({ ok: false }, 200),
  );
  assert.equal(bad.ok, false);
  assert.match(bad.error, /health not ok/);
});

test('probeJson validates /health/environment expectEnv even on non-2xx', async () => {
  const match = await probeJson('https://example.test', '/health/environment', 'jfl', async () =>
    jsonResponse({ environment: 'jfl', ok: false }, 503),
  );
  assert.equal(match.ok, true);
  assert.equal(match.environment, 'jfl');

  const mismatch = await probeJson('https://example.test', '/health/environment', 'jfl', async () =>
    jsonResponse({ environment: 'production', ok: true }, 200),
  );
  assert.equal(mismatch.ok, false);
  assert.match(mismatch.error, /expected="jfl"/);
});

test('probeHtml requires status ok and shell markers', async () => {
  const good = await probeHtml('https://example.test', '/', async () =>
    new Response('<!doctype html><meta name="viewport"><title>Fremont Derby</title>', { status: 200 }),
  );
  assert.equal(good.ok, true);

  const missingShell = await probeHtml('https://example.test', '/', async () =>
    new Response('<html>nope</html>', { status: 200 }),
  );
  assert.equal(missingShell.ok, false);
  assert.match(missingShell.error, /shell markers/);
});

test('release-source permanent branches: main←gamma strict; gamma←jfl/dru permanent heads', () => {
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'main', head: 'fremontderby-gamma', strict: true }).ok,
    true,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'main', head: 'fremontderby-jfl', strict: true }).ok,
    false,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'fremontderby-jfl' }).ok,
    true,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'fremontderby-dru' }).ok,
    true,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'fremontderby-gamma' }).ok,
    false,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'main' }).ok,
    false,
  );
});

test('release-source blocks forks into main and gamma regardless of head name', () => {
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'main', head: 'fremontderby-gamma', isFork: true }).ok,
    false,
  );
  assert.equal(
    evaluateReleaseSourcePolicy({ base: 'fremontderby-gamma', head: 'jfl/x', isFork: true }).ok,
    false,
  );
});
