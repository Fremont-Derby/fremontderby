import assert from 'node:assert/strict';
import test from 'node:test';

import { renderRulesPage } from '../src/publicPages.js';

test('public Rules matches the authoritative postseason qualification and anchor contract', () => {
  const html = renderRulesPage();

  assert.match(html, /four active players/i);
  assert.match(html, /at least three players with four or more official regular-season matches for that team/i);
  assert.match(html, /every other selected player must have at least three official matches for that team/i);
  assert.match(html, /eligibility is a pool, not a four-player roster cap/i);
  assert.match(html, /every additional player with 3\+ team matches is eligible/i);
  assert.match(html, /Qualification is team-specific/i);
  assert.match(html, /representing another team do not count toward postseason qualification for this team/i);
  assert.match(html, /declares one anchor from the four players submitted for that postseason matchup/i);
  assert.match(html, /anchor is then locked/i);
  assert.match(html, /finish tied 2-2/i);
  assert.match(html, /pre-declared anchors play the deciding handicapped anchor match/i);
});

test('public Rules no longer contains the superseded three-round-only playoff roster rule', () => {
  const html = renderRulesPage();

  assert.doesNotMatch(html, /Every player on a team's playoff roster must have played at least three regular-season rounds/i);
  assert.doesNotMatch(html, /lock four-player playoff rosters/i);
  assert.doesNotMatch(html, /each captain selects an eligible anchor player/i);
});
