import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTeamsPage } from '../src/teamsPage.js';

test('teams page uses the signed-in session and human-readable team setup controls', () => {
  const html = renderTeamsPage();
  assert.match(html, /Fremont Derby Teams/);
  assert.match(html, /League night|Check in|availability/i);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/teams/);
  assert.doesNotMatch(html, />Season ID</i);
  assert.doesNotMatch(html, />Access token</i);
});
