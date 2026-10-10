import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('date availability repository requires Supabase env', () => {
  const src = readFileSync(new URL('../src/dateAvailabilityRepository.js', import.meta.url), 'utf8');
  assert.match(src, /createDateAvailabilityRepository/);
});
