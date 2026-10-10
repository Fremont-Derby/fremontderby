import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('mobile-remaining-pages-touch.test', () => {
  const src = readFileSync(new URL('../src/adminOperationsPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderAdminOperationsPage/);
  assert.match(src, /href="\/admin\/players"/);
  assert.match(src, /href="\/season-setup"/);
  assert.match(src, /href="\/messages\/moderation"/);
});
