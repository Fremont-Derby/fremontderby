import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('mobile dock includes check in', () => {
  const src = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  assert.match(src, /href: '\/availability', label: 'Check in'/);
  assert.match(src, /repeat\(6,/);
  assert.match(src, /data-nav-key="availability"/);
});
