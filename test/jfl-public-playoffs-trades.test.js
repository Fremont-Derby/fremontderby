import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import routerEntry from '../src/routerEntry.js';

test('JFL router entry serves playoffs and trades HTML pages', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /renderPlayoffsPage/);
  assert.match(src, /renderTradesPage/);
  assert.match(src, /pathname === '\/playoffs'/);
  assert.match(src, /pathname === '\/trades'/);
  assert.match(src, /HTML \/trades is a public-surface page again/);
});

test('JFL worker serves /playoffs and /trades as HTML 200', async () => {
  const env = { ENVIRONMENT: 'jfl' };
  for (const path of ['/playoffs', '/trades']) {
    const response = await routerEntry.fetch(new Request(`https://jfl.fremontderby.test${path}`), env, {});
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') || '', /text\/html/);
    assert.match(html, /<!doctype html>/i);
    assert.doesNotMatch(html, /This dog lost the rack/);
    if (path === '/playoffs') assert.match(html, /Fremont Derby Playoffs/);
    if (path === '/trades') assert.match(html, /Fremont Derby Trades/);
  }
});
