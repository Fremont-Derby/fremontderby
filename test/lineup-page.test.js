import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup page renders a signed-in human-readable three-player captain flow', () => {
  const html = renderLineupPage();

  assert.match(html, /Fremont Derby Lineup/);
  assert.match(html, /data-team-select/);
  assert.match(html, /data-round-select/);
  assert.doesNotMatch(html, /data-team-id/);
  assert.doesNotMatch(html, /data-round-id/);
  assert.doesNotMatch(html, /data-token/);
  assert.doesNotMatch(html, />Team ID</i);
  assert.doesNotMatch(html, />Round ID</i);
  assert.doesNotMatch(html, />Access token</i);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /Matchup/);
  assert.match(html, /Round '/);
  assert.match(html, / · vs /);
  assert.match(html, /round\.opponentName/);
  assert.match(html, /Table '/);
  assert.match(html, /data-status-close/);
  assert.match(html, /role="status"/);
  assert.match(html, /data-availability-body/);
  assert.match(html, /data-slots/);
  assert.match(html, /data-submit/);
  assert.match(html, /Lock lineup/);
  assert.match(html, /Opponent order stays hidden until both teams submit/);
  assert.match(html, /index<3/);
  assert.doesNotMatch(html, /4 slots/);
  assert.match(html, /\/api\/teams\/:teamId\/rounds\/:roundId\/availability/);
  assert.match(html, /\/api\/teams\/:teamId\/rounds\/:roundId\/lineup/);
});
