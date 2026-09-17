import assert from 'node:assert/strict';
import test from 'node:test';
import { repairAvailabilityScript } from '../src/availabilityScriptRepair.js';

test('availability repair still prefers the upcoming league night', () => {
  const source = '<html><body><header></header><script>const requestedContext=contexts.find((context)=>context.roundId===requested);if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;</script></body></html>';
  const html = repairAvailabilityScript(source);
  assert.match(html, /const upcoming=contexts.find/);
});

test('availability repair injects next match from /api/me/matches', () => {
  const source = '<html><body><header></header><script>const requestedContext=contexts.find((context)=>context.roundId===requested);if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;</script></body></html>';
  const html = repairAvailabilityScript(source);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});
