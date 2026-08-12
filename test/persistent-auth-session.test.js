import assert from 'node:assert/strict';
import test from 'node:test';

import { injectPersistentAuthSession } from '../src/persistentAuthSession.js';
import router from '../src/routerEntry.js';

test('persistent auth bootstrap is injected before page scripts', async () => {
  const source = '<!doctype html><html><head><title>Test</title><script data-page>window.pageReady=true;</script></head><body></body></html>';
  const response = await injectPersistentAuthSession(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const html = await response.text();

  const bootstrapIndex = html.indexOf('data-fd-persistent-auth');
  const pageScriptIndex = html.indexOf('data-page');
  assert.ok(bootstrapIndex > -1);
  assert.ok(pageScriptIndex > bootstrapIndex);
  assert.match(html, /fd\.accessToken/);
  assert.match(html, /fd\.refreshToken/);
  assert.match(html, /window\.localStorage/);
  assert.match(html, /window\.sessionStorage/);
  assert.match(html, /persistentSessionSetItem/);
  assert.match(html, /persistentSessionRemoveItem/);
  assert.match(html, /Keep the existing sessionStorage-only behavior/);
});

test('persistent auth bootstrap leaves non-HTML responses untouched', async () => {
  const source = JSON.stringify({ ok: true });
  const original = new Response(source, {
    headers: { 'content-type': 'application/json' },
  });
  const response = await injectPersistentAuthSession(original);

  assert.equal(await response.text(), source);
  assert.equal(response.headers.get('content-type'), 'application/json');
});

test('router entry applies persistence to legacy and direct HTML pages', async () => {
  for (const path of ['/profile', '/admin']) {
    const response = await router.fetch(
      new Request(`https://fremontderby.test${path}`),
      {},
      {},
    );
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.equal((html.match(/data-fd-persistent-auth/g) || []).length, 1, path);

    const bootstrapIndex = html.indexOf('data-fd-persistent-auth');
    const firstSessionRead = html.indexOf("sessionStorage.getItem('fd.accessToken')");
    if (firstSessionRead !== -1) {
      assert.ok(bootstrapIndex < firstSessionRead, path);
    }
  }
});

test('router entry does not inject browser persistence into API JSON', async () => {
  const response = await router.fetch(
    new Request('https://fremontderby.test/api/me/scorable-matches'),
    {},
    {},
  );
  const body = await response.text();

  assert.doesNotMatch(body, /data-fd-persistent-auth/);
});
