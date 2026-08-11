import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('availability page uses signed-in human-readable league-night selection', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /Fremont Derby Availability/);
  assert.match(html, /data-context-select/);
  assert.doesNotMatch(html, /data-season-id/);
  assert.doesNotMatch(html, /data-round-id/);
  assert.doesNotMatch(html, /data-token/);
  assert.doesNotMatch(html, />Season ID</i);
  assert.doesNotMatch(html, />Round ID</i);
  assert.doesNotMatch(html, />Access token</i);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /data-availability-status="available"/);
  assert.match(html, /data-availability-status="unsure"/);
  assert.match(html, /data-availability-status="unavailable"/);
  assert.match(html, /\/availability\/me/);
  assert.match(html, /\/free-agent-availability\/me/);
  assert.match(html, /No published regular-season rounds/);
});
