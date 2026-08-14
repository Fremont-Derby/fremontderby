import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { isKnownAppPagePath } from '../src/appShell.js';

test('appShell nav is valid and includes playoffs and trades', () => {
  const src = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  assert.match(src, /href: '\/schedule', label: 'Schedule'/);
  assert.match(src, /href: '\/playoffs', label: 'Playoffs'/);
  assert.match(src, /href: '\/trades', label: 'Trades'/);
  assert.ok(isKnownAppPagePath('/playoffs'));
  assert.ok(isKnownAppPagePath('/trades'));
  assert.ok(isKnownAppPagePath('/admin/audit'));
});

test('trades are not retired at router entry', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /if \(isRetiredTradePath/);
  assert.match(src, /Trades restored/);
});

test('router serves /trades page', () => {
  const src = readFileSync(new URL('../src/router.js', import.meta.url), 'utf8');
  assert.match(src, /pathname === '\/trades'/);
  assert.match(src, /renderTradesPage/);
});
