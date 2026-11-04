import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { renderJflNotFoundPage } from '../src/jflNotFoundPage.js';

const routerSource = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');

test('JFL 404 renderer uses the supplied embedded artwork and accessible recovery copy', () => {
  const html = renderJflNotFoundPage('/missing-page');

  assert.match(html, /data:image\/webp;base64,/);
  assert.match(html, /Sad basset hound Buster sitting beside a wooden sign announcing a 404 error/);
  assert.match(html, /<h1 id="missing-title">Page not found\.<\/h1>/);
  assert.match(html, /href="\/">Back home<\/a>/);
  assert.match(html, /href="\/teams">Teams<\/a>/);
  assert.match(html, /href="\/schedule">Schedule<\/a>/);
  assert.match(html, /href="\/standings">Standings<\/a>/);
  assert.match(html, /width="840"/);
  assert.match(html, /height="458"/);
});

test('JFL 404 renderer escapes the missing pathname', () => {
  const html = renderJflNotFoundPage('/<script>bad&"path"</script>');

  assert.doesNotMatch(html, /<script>bad/);
  assert.match(html, /&lt;script&gt;bad&amp;&quot;path&quot;&lt;\/script&gt;/);
});

test('router swaps browser HTML 404s only when the runtime is JFL', () => {
  assert.match(routerSource, /env\.ENVIRONMENT === 'jfl'/);
  assert.match(routerSource, /response\.status === 404 && isHtmlResponse\(response\)/);
  assert.match(routerSource, /renderJflNotFoundPage/);
  assert.match(routerSource, /!url\.pathname\.startsWith\('\/api\/'\)/);
});
