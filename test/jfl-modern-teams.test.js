import test from 'node:test';
import assert from 'node:assert/strict';

import {
  jflModernTeamsStyles,
  normalizeTeamCards,
  renderJflModernTeams,
  renderTeamCard,
  routeJflModernTeams,
  visibleTeamActions,
} from '../src/jflModernTeams.js';

const management = {
  captain_teams: [{
    teamId: 'team-mine',
    teamName: 'JFL QA Breakers',
    seasonId: 'season-active',
    seasonName: 'Active League Lab',
    roster: [
      { membershipId: 'membership-captain', playerId: 'player-captain', displayName: 'Alex Captain', role: 'captain' },
      { membershipId: 'membership-player', playerId: 'player-member', displayName: 'Morgan Member', role: 'player' },
    ],
  }],
};

const requests = {
  joinable_teams: [
    { teamId: 'team-other', teamName: 'Rail Riders', seasonId: 'season-active', seasonName: 'Active League Lab', seasonStatus: 'active' },
    { teamId: 'team-mine', teamName: 'JFL QA Breakers', seasonId: 'season-active', seasonName: 'Active League Lab', hasActiveMembership: true },
    { teamId: 'team-pending', teamName: 'Cue Crew', seasonId: 'season-next', seasonName: 'Fall League', pendingRequestId: 'request-pending' },
  ],
};

test('normalizes my captain and member teams first without duplicate directory cards', () => {
  const cards = normalizeTeamCards(management, requests);
  assert.deepEqual(cards.map((card) => card.teamId), ['team-mine', 'team-other', 'team-pending']);
  assert.equal(cards[0].relationship, 'captain');
  assert.equal(cards[0].isMine, true);
  assert.equal(cards[0].captainName, 'Alex Captain');
  assert.equal(cards[0].rosterCount, 2);
});

test('visible actions are contextual and role-aware', () => {
  assert.deepEqual(visibleTeamActions({ relationship: 'captain' }), ['manage', 'message']);
  assert.deepEqual(visibleTeamActions({ relationship: 'member' }), ['roster', 'message']);
  assert.deepEqual(visibleTeamActions({ relationship: 'pending' }), ['cancel']);
  assert.deepEqual(visibleTeamActions({ relationship: 'none' }), ['join']);
});

test('compact cards show membership, captain, roster, and only authorized actions without ID labels', () => {
  const captainHtml = renderTeamCard(normalizeTeamCards(management, requests)[0]);
  assert.match(captainHtml, /My team/);
  assert.match(captainHtml, />Captain</);
  assert.match(captainHtml, /Alex Captain/);
  assert.match(captainHtml, /2 players/);
  assert.match(captainHtml, />Manage roster</);
  assert.doesNotMatch(captainHtml, />Request to join</);
  assert.doesNotMatch(captainHtml, /Team ID|Membership ID|Player ID/i);

  const otherHtml = renderTeamCard(normalizeTeamCards(management, requests)[1]);
  assert.match(otherHtml, />Request to join</);
  assert.doesNotMatch(otherHtml, />Manage roster</);
});

test('modern Teams document preserves canonical read/write APIs, auth, and legacy escape hatch', () => {
  const html = renderJflModernTeams();
  assert.match(html, /data-fd-modern-teams="true"/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /\/api\/me\/team-membership-requests/);
  assert.match(html, /\/api\/teams\/.*membership-request/);
  assert.match(html, /\/api\/team-membership-requests\/.*\/respond/);
  assert.match(html, /\/api\/team-invitations\/.*\/respond/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\?ui=legacy/);
  assert.match(html, /data-fd-shell/);
  assert.match(html, /data-fd-mobile-dock/);
});

test('modern Teams emits syntactically valid inline browser scripts', () => {
  const html = renderJflModernTeams();
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1]);
  assert.ok(scripts.length > 0);
  for (const source of scripts) assert.doesNotThrow(() => new Function(source));
});

test('route is JFL GET /teams only and never replaces APIs, writes, or explicit legacy view', async () => {
  const modern = routeJflModernTeams(new Request('https://jfl.fremontderby.com/teams'), { ENVIRONMENT: 'jfl' });
  assert.ok(modern instanceof Response);
  assert.equal(modern.status, 200);
  assert.equal(modern.headers.get('x-fremont-ui-mode'), 'modern-teams-v1');
  assert.match(await modern.text(), /data-fd-modern-teams="true"/);

  assert.equal(routeJflModernTeams(new Request('https://jfl.fremontderby.com/teams?ui=legacy'), { ENVIRONMENT: 'jfl' }), null);
  assert.equal(routeJflModernTeams(new Request('https://jfl.fremontderby.com/teams'), { ENVIRONMENT: 'production' }), null);
  assert.equal(routeJflModernTeams(new Request('https://jfl.fremontderby.com/api/me/teams'), { ENVIRONMENT: 'jfl' }), null);
  assert.equal(routeJflModernTeams(new Request('https://jfl.fremontderby.com/teams', { method: 'POST' }), { ENVIRONMENT: 'jfl' }), null);
});

test('modern Teams keeps touch, focus, reduced-motion, and forced-colors contracts', () => {
  assert.match(jflModernTeamsStyles, /min-height:\s*44px/);
  assert.match(jflModernTeamsStyles, /:focus-visible/);
  assert.match(jflModernTeamsStyles, /prefers-reduced-motion/);
  assert.match(jflModernTeamsStyles, /forced-colors:\s*active/);
});
