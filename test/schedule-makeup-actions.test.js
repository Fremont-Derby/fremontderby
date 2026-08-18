import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('schedule shows makeup pill and three actions', () => {
  const src = readFileSync(new URL('../src/schedulePage.js', import.meta.url), 'utf8');
  assert.match(src, /repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(src, /Makeup /);
  assert.match(src, /score\.href=.*makeup/s);
});

test('score picker accepts date query param', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /get\('date'\)/);
});
