import test from 'node:test';
import assert from 'node:assert/strict';

import { renderJflModernSchedule } from '../src/jflModernSchedule.js';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

async function enhancedScheduleHtml() {
  const response = new Response(renderJflModernSchedule(), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const enhanced = await enhancePublicSeasonSelection(response, '/schedule');
  return enhanced.text();
}

test('JFL Schedule prefers a published complete season over an unpublished registration fixture', async () => {
  const html = await enhancedScheduleHtml();
  assert.match(
    html,
    /find\(\(season\) => season\.status === 'complete'\).*find\(\(season\) => season\.status === 'registration'\)/s,
  );
});

test('JFL Schedule clears stale rounds while a newly selected season loads', async () => {
  const html = await enhancedScheduleHtml();
  assert.match(html, /rounds = \[\]; groups\.replaceChildren\(\); emptyEl\.hidden = true; roundSelect\.replaceChildren\(\); roundSelect\.disabled = true;/);
  assert.match(html, /setStatus\('Loading schedule…'\)/);
});

test('JFL Schedule makes an unpublished pending season explicit instead of looking broken', async () => {
  const html = await enhancedScheduleHtml();
  assert.match(html, /Schedule not published yet/);
  assert.match(html, /schedule has not been published yet\./);
});

test('JFL Schedule exposes a visible empty state when a season schedule request fails', async () => {
  const html = await enhancedScheduleHtml();
  assert.match(html, /emptyEl\.hidden = false/);
  assert.match(html, /We could not load this schedule\. Try this season again\./);
  assert.match(html, /roundSelect\.disabled = true/);
});
