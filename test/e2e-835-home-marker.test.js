import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderIntroPage } from '../src/publicPages.js';

test('public home intro does not show an internal E2E deploy badge', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  const html = renderIntroPage();
  assert.doesNotMatch(src, /data-e2e-deploy/);
  assert.doesNotMatch(src, /E2E gamma/);
  assert.doesNotMatch(html, /data-e2e-deploy/);
  assert.doesNotMatch(html, /E2E gamma/);
  assert.match(html, /Fremont Derby/);
  assert.match(html, /Join \/ sign in/);
  assert.match(html, /<strong>Check in:<\/strong>/);
  assert.doesNotMatch(html, /<strong>Availability:<\/strong>/);
});
