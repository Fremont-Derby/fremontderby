import test from 'node:test';
import assert from 'node:assert/strict';

import { enhanceScheduleAvailability } from '../src/scheduleAvailabilityEnhancer.js';

function scheduleHtml() {
  return `<!doctype html><html><head><style></style></head><body>
    <select data-season-select></select><select data-round-select></select>
    <article class="fd-schedule-match">
      <span class="fd-schedule-match__state">finalized</span>
      <span class="fd-schedule-match__score">2 – 1</span>
      <details class="fd-schedule-match__details"><summary>Details</summary><div class="fd-schedule-match__actions">
        <a href="/scorecard?match=abc">View score</a><a href="/messages?matchup=abc">Messages</a>
      </div></details>
    </article>
    <div class="matches" data-match-list></div>
  </body></html>`;
}

test('Schedule enhancer makes final scores prominent and strips obsolete final actions', async () => {
  const response = await enhanceScheduleAvailability(new Response(scheduleHtml(), {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const html = await response.text();

  assert.match(html, /fd-schedule-match__score\{min-width:64px!important/);
  assert.match(html, /fd-schedule-match\[data-final-result="true"\] \.fd-schedule-match__score/);
  assert.match(html, /href\.startsWith\('\/messages\?matchup='\)/);
  assert.match(html, /final&&text==='view score'/);
  assert.match(html, /details\.dataset\.emptyActions='true'/);
});
