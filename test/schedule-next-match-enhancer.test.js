import assert from 'node:assert/strict';
import test from 'node:test';
import { enhanceScheduleAvailability } from '../src/scheduleAvailabilityEnhancer.js';

test('schedule enhancer marks next match from /api/me/matches', async () => {
  const source = '<html><head><style></style></head><body><div class="matches" data-match-list></div></body></html>';
  const response = await enhanceScheduleAvailability(new Response(source, {
    headers: { 'content-type': 'text/html' },
  }));
  const html = await response.text();
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
  assert.match(html, /data-date-availability/);
});
