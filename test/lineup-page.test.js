import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup page renders captain lineup controls', () => {
  const html = renderLineupPage();

  assert.match(html, /Fremont Derby Lineup/);
  assert.match(html, /data-team-id/);
  assert.match(html, /data-round-id/);
  assert.match(html, /data-token/);
  assert.match(html, /data-availability-body/);
  assert.match(html, /data-slots/);
  assert.match(html, /data-submit/);
  assert.match(html, /data-lineup-body/);
  assert.match(html, /eligible-free-agents|availability/);
  assert.match(html, /\/api\/teams\/:teamId\/rounds\/:roundId\/lineup/);
});
