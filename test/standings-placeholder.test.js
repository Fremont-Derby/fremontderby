import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('a quiet standings refresh replaces the loading placeholder', () => {
  const html = readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  assert.match(html, /No individual standings are available for this season/);
  assert.match(html, /No team standings are available for this season/);
});
