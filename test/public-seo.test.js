import assert from 'node:assert/strict';
import test from 'node:test';
import { injectPublicSeo, seoForPath } from '../src/publicSeo.js';

test('seo map covers primary public surfaces', () => {
  for (const path of ['/', '/standings', '/schedule', '/rules', '/demo']) {
    assert.ok(seoForPath(path)?.description);
  }
});

test('injectPublicSeo adds description and Open Graph tags', async () => {
  const source = '<!doctype html><html><head><title>Old</title></head><body>hi</body></html>';
  const response = await injectPublicSeo(
    new Response(source, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
    '/standings',
  );
  const html = await response.text();
  assert.match(html, /name="description"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /Standings/);
  assert.match(html, /data-fd-public-seo/);
});
