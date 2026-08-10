import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('availability page renders player registration and round availability controls', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /Fremont Derby Availability/);
  assert.match(html, /data-season-id/);
  assert.match(html, /data-round-id/);
  assert.match(html, /data-token/);
  assert.match(html, /data-register/);
  assert.match(html, /data-roster-status="available"/);
  assert.match(html, /data-free-agent-status="available"/);
  assert.match(html, /\/api\/seasons\/:seasonId\/free-agents\/me/);
  assert.match(html, /\/api\/rounds\/:roundId\/availability\/me/);
  assert.match(html, /\/api\/rounds\/:roundId\/free-agent-availability\/me/);
  assert.match(html, /fd.accessToken/);
});
