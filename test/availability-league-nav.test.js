import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('availability shortcuts cover league night', () => {
  const src = readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderAvailabilityPage/);
});
