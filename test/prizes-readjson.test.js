import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the prizes page defines readJson in the browser script', () => {
  const src = readFileSync(new URL('../src/prizesPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderPrizesPage/);
  assert.match(src, /href="\/rules"/);
});
