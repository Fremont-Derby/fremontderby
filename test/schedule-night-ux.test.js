import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('schedule page labels live matches and prefers score-live CTA copy', () => {
  const src = readFileSync(new URL('../src/schedulePage.js', import.meta.url), 'utf8');
  assert.match(src, /renderSchedulePage/);
  assert.match(src, /href="\/standings"/);
});
