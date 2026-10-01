import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTradesPage } from '../src/tradesPage.js';

test('trades page is mobile-first with touch-sized controls and clear title', () => {
  const html = renderTradesPage();
  assert.match(html, /<title>Fremont Derby Trades<\/title>/);
  assert.match(html, /viewport/);
  assert.match(html, /min-height:\s*44px/);
  assert.match(html, /color-scheme:\s*dark/);
});
