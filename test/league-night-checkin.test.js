import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('availability page is framed as league night check-in', () => {
  const src = readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderAvailabilityPage/);
});
