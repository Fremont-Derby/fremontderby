import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPrizesPage } from '../src/prizesPage.js';

test('prizes page is mobile-first with touch-sized controls', () => {
  const html = renderPrizesPage();
  assert.match(html, /<title>Fremont Derby Prizes<\/title>/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /min-height:\s*44px/);
  assert.match(html, /color-scheme:\s*dark/);
  assert.match(html, /:focus-visible|:focus/);
});
