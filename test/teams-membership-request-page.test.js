import test from 'node:test';
import assert from 'node:assert/strict';

import { renderTeamsPage } from '../src/teamsPage.js';

test('Teams page exposes player join requests and captain approvals', () => {
  const html = renderTeamsPage();

  assert.match(html, /Join a team/);
  assert.match(html, /Requests for teams I captain/);
  assert.match(html, /data-request-membership/);
  assert.match(html, /data-respond-membership-request/);
  assert.match(html, /\/api\/me\/team-membership-requests/);
  assert.match(html, /membership-request/);
  assert.match(html, /\/respond/);
  assert.match(html, /\/cancel/);
});

test('Teams page makes join-request status self-service', () => {
  const html = renderTeamsPage();
  assert.match(html, /Request to join/);
  assert.match(html, /Cancel request/);
  assert.match(html, /Approve/);
  assert.match(html, /Decline/);
  assert.match(html, /Player added to team/);
});
