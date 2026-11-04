import test from 'node:test';
import assert from 'node:assert/strict';

import { environmentFingerprint, injectEnvironmentFingerprint } from '../src/environmentFingerprint.js';
import router from '../src/routerEntry.js';

const page = () => new Response('<!doctype html><html><head><title>Test</title></head><body><main>Page</main></body></html>', {
  headers: { 'content-type': 'text/html; charset=utf-8' },
});

test('JFL shows its deployed SHA on ordinary and legacy pages', async () => {
  const request = new Request('https://jfl.fremontderby.com/profile?shell=legacy');
  const env = { ENVIRONMENT: 'jfl', CF_VERSION_METADATA: { tag: 'fdc65c143e2d55a247cb682e2dd83eed96858d21' } };
  const response = await injectEnvironmentFingerprint(page(), request, env);
  const html = await response.text();
  assert.match(html, /data-fd-environment-fingerprint="jfl"/);
  assert.match(html, /JFL · fdc65c14/);
  assert.match(html, /role="note"/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('DRU and Gamma have distinct labels while production stays undecorated', async () => {
  for (const lane of ['dru', 'gamma']) {
    const response = await injectEnvironmentFingerprint(
      page(), new Request(`https://${lane}.fremontderby.com/teams`),
      { ENVIRONMENT: lane, DEPLOY_GIT_SHA: '1234567890abcdef1234567890abcdef12345678' },
    );
    assert.match(await response.text(), new RegExp(`${lane.toUpperCase()} · 12345678`));
  }
  const response = await injectEnvironmentFingerprint(
    page(), new Request('https://fremontderby.com/teams'), { ENVIRONMENT: 'production' },
  );
  assert.doesNotMatch(await response.text(), /data-fd-environment-fingerprint/);
});

test('host/runtime disagreement is a prominent failure, including production on JFL', async () => {
  for (const runtime of ['production', 'dru']) {
    const request = new Request('https://jfl.fremontderby.com/schedule');
    assert.equal(environmentFingerprint(request, { ENVIRONMENT: runtime }).mismatch, true);
    const response = await injectEnvironmentFingerprint(page(), request, { ENVIRONMENT: runtime });
    const html = await response.text();
    assert.match(html, /ENVIRONMENT MISMATCH/);
    assert.match(html, /Expected JFL/);
    assert.match(html, /role="alert"/);
    assert.doesNotMatch(html, /data-fd-environment-mismatch="false"/);
  }
  const decorated = new Response('<html><head></head><body><span data-fd-environment-fingerprint="jfl">JFL</span></body></html>', {
    headers: { 'content-type': 'text/html' },
  });
  const alert = await injectEnvironmentFingerprint(
    decorated, new Request('https://dru.fremontderby.com/teams'), { ENVIRONMENT: 'jfl' },
  );
  assert.match(await alert.text(), /ENVIRONMENT MISMATCH/);
});

test('fingerprint escapes untrusted metadata, is idempotent, and leaves APIs untouched', async () => {
  const request = new Request('https://jfl.fremontderby.com/scorecard');
  const env = { ENVIRONMENT: 'jfl', DEPLOY_GIT_SHA: '<script>alert(1)</script>' };
  const first = await injectEnvironmentFingerprint(page(), request, env);
  const second = await injectEnvironmentFingerprint(first, request, env);
  const html = await second.text();
  assert.equal((html.match(/data-fd-environment-fingerprint="jfl"/g) || []).length, 1);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;/);
  const api = Response.json({ ok: true });
  assert.equal(await injectEnvironmentFingerprint(api, request, env), api);
});

test('JFL router includes the marker on a real rendered page', async () => {
  const response = await router.fetch(
    new Request('https://jfl.fremontderby.com/design-system'),
    {
      ENVIRONMENT: 'jfl',
      DEPLOY_GIT_SHA: 'fdc65c143e2d55a247cb682e2dd83eed96858d21',
      CF_VERSION_METADATA: { id: 'test-version' },
    },
    {},
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-modern-shell="true"/);
  assert.match(html, /data-fd-environment-fingerprint="jfl"/);
  assert.match(html, /data-fd-jfl-deploy-sha>fdc65c14<\/code>/);
  assert.doesNotMatch(html, /class="fd-environment-fingerprint/);
});
