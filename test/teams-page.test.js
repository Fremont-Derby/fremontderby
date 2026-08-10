import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTeamsPage } from '../src/teamsPage.js';

test('teams page renders team creation and roster management controls', () => {
  const html = renderTeamsPage();

  assert.match(html, /Fremont Derby Teams/);
  assert.match(html, /data-season-id/);
  assert.match(html, /data-team-name/);
  assert.match(html, /data-token/);
  assert.match(html, /data-refresh/);
  assert.match(html, /data-captain-teams/);
  assert.match(html, /data-invitations/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /\/api\/seasons\//);
  assert.match(html, /\/api\/teams\//);
  assert.match(html, /\/api\/team-invitations\//);
  assert.match(html, /\/api\/team-memberships\//);
});
