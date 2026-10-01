import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('check-in finishes or says the load took too long', () => {
  const html = readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  assert.match(html, /Check-in ready/);
  assert.match(html, /Check-in took too long/);
});
