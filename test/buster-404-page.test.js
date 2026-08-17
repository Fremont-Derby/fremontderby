import assert from 'node:assert/strict';
import test from 'node:test';
import { decorateHtmlWithShell, renderNotFoundPage, renderPrimaryNavigation } from '../src/appShell.js';

test('Gamma 404 renderer uses the approved Buster artwork and preserves recovery UX', () => {
  const html = renderNotFoundPage('/missing?<script>');
  assert.match(html, /data:image\/webp;base64,/);
  assert.match(html, /Basset hound Buster sitting beside a 404 error sign/i);
  assert.match(html, /Page not found/i);
  assert.match(html, /\/missing\?&lt;script&gt;/);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/teams"/);
  assert.match(html, /href="\/schedule"/);
  assert.match(html, /href="\/standings"/);
  assert.doesNotMatch(html, /<svg[^>]*viewBox="0 0 640 390"/);
});

test('Gamma app shell exports remain available through the Buster 404 wrapper', () => {
  assert.equal(typeof renderPrimaryNavigation, 'function');
  assert.equal(typeof decorateHtmlWithShell, 'function');
});
