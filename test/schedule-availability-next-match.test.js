import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('schedule availability enhancer injects next-match from /api/me/matches', () => {
  const src = readFileSync(new URL('../src/scheduleAvailabilityEnhancer.js', import.meta.url), 'utf8');
  assert.match(src, /enhanceScheduleAvailability/);
});
