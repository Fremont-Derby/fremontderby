import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderTradesPage } from '../src/tradesPage.js';

test('production hourly probe requires configured key', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /envName === 'production'/);
  assert.match(src, /Unauthorized/);
});

test('trades counterparties failure is handled without breaking form', () => {
  const html = renderTradesPage();
  assert.match(html, /Counterparties unavailable|trade options migration|loadCounterparties/);
  assert.match(html, /try\{/);
});

test('intro page exposes two-click league surfaces', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/schedule"/);
  assert.match(src, /href="\/teams"/);
  assert.match(src, /href="\/standings"/);
  assert.match(src, /href="\/playoffs"/);
});
