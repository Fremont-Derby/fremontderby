import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin operations links score', () => {
  const src = readFileSync(new URL('../src/adminOperationsPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/standings"/);
});

test('admin seasons links score and audit', () => {
  const src = readFileSync(new URL('../src/adminSeasonsPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/admin\/audit"/);
});
