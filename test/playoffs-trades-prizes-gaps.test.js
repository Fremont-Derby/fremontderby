import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderPlayoffsPage } from '../src/playoffsPage.js';
import { renderTradesPage } from '../src/tradesPage.js';
import { renderPrizesPage } from '../src/prizesPage.js';

test('playoffs page shows bracket and admin controls', () => {
  const html = renderPlayoffsPage();
  assert.match(html, /Playoffs/);
  assert.match(html, /start-playoffs/);
  assert.match(html, /advance-championship/);
  assert.match(html, /4-player lineup/);
});

test('trades page uses session auth not raw token field', () => {
  const html = renderTradesPage();
  assert.match(html, /fd\.accessToken|sessionStorage/);
  assert.doesNotMatch(html, /data-token type="password"/);
  assert.match(html, /\/api\/me\/trades/);
  assert.match(html, /\/api\/me\/teams/);
});

test('prizes page links standings for eligibility context', () => {
  const html = renderPrizesPage();
  assert.match(html, /Singles prize eligibility|\/standings/);
});

test('router and shell expose /playoffs', () => {
  const router = readFileSync(new URL('../src/router.js', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  assert.match(router, /\/playoffs/);
  assert.match(shell, /\/playoffs/);
});
