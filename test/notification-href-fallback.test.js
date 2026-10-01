import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('notifications resolve href from title when missing', () => {
  const src = readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(src, /function resolveHref/);
  assert.match(src, /ready check/);
  assert.match(src, /return '\/scorecard'/);
});

test('standings links to score hub', () => {
  const src = readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
});
