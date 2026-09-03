import assert from 'node:assert/strict';
import test from 'node:test';

import { renderTradesPage } from '../src/tradesPage.js';

test('JFL /trades uses the Profile session instead of an access-token field', () => {
  const html = renderTradesPage();
  assert.match(html, /Fremont Derby Trades/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /href="\/profile"/);
  assert.doesNotMatch(html, /Access token/i);
  assert.doesNotMatch(html, /data-token/);
});
