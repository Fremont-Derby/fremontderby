import test from 'node:test';
import assert from 'node:assert/strict';

import {
  availableInvitationPlayers,
  availableTeamApplicationSeasons,
  friendlyTeamsError,
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
  assert.deepEqual(visibleTeamActions({ relationship: 'captain' }), ['message']);
  assert.deepEqual(visibleTeamActions({ relationship: 'member' }), ['message']);
  assert.deepEqual(visibleTeamActions({ relationship: 'pending' }), ['cancel']);
  assert.deepEqual(visibleTeamActions({ relationship: 'none' }), ['join']);
  assert.deepEqual(visibleTeamActions({ relationship: 'directory' }), []);
});

test('active-season directory teams remain discoverable when no team is joinable', () => {
  const cards = normalizeTeamCards(management, {
    joinable_teams: [],
    league_teams: [
      { teamId: 'team-other', teamName: 'Rail Riders', seasonId: 'season-active', seasonName: 'Active League Lab', captainName: 'Casey Captain' },
      { teamId: 'team-mine', teamName: 'JFL QA Breakers', seasonId: 'season-active', seasonName: 'Active League Lab' },
    ],
  });
  assert.deepEqual(cards.map((card) => card.teamId), ['team-mine', 'team-other']);
  assert.equal(cards[1].relationship, 'directory');
  assert.equal(cards[1].captainName, 'Casey Captain');
  assert.deepEqual(visibleTeamActions(cards[1]), []);
  const directoryHtml = renderTeamCard(cards[1]);
  assert.match(directoryHtml, /Casey Captain/);
  assert.match(directoryHtml, /fd-team-card__facts--single/);
  assert.doesNotMatch(directoryHtml, />Roster</);
  assert.doesNotMatch(directoryHtml, /Roster details/);
  assert.doesNotMatch(directoryHtml, /Shown after joining|Request to join|Manage roster|Roster & captain|<details/);
});

test('compact cards show membership, captain, roster, and only authorized actions without ID labels', () => {
  const captainHtml = renderTeamCard(normalizeTeamCards(management, requests)[0]);
  assert.match(captainHtml, /My team/);
  assert.match(captainHtml, />Captain</);
  assert.match(captainHtml, /Alex Captain/);
  assert.match(captainHtml, />Roster</);
  assert.match(captainHtml, /2 players/);
  assert.doesNotMatch(captainHtml, /fd-team-card__facts--single/);
  assert.match(captainHtml, />Manage roster</);
  assert.equal((captainHtml.match(/Manage roster/g) || []).length, 1);
  assert.doesNotMatch(captainHtml, />Request to join</);
  assert.doesNotMatch(captainHtml, /Team ID|Membership ID|Player ID/i);

  const otherHtml = renderTeamCard(normalizeTeamCards(management, requests)[1]);
  assert.match(otherHtml, />Request to join</);
  assert.doesNotMatch(otherHtml, />Manage roster</);
});

test('existing active applications are removed from the new-team season picker', () => {
  const seasons = [
    { id: 'season-open', name: 'Open', status: 'registration' },
    { id: 'season-used', name: 'Used', status: 'registration' },
    { id: 'season-old', name: 'Old', status: 'completed' },
  ];
  const registrations = [
    { seasonId: 'season-used', applications: [{ status: 'applied' }] },
    { seasonId: 'season-open', applications: [{ status: 'withdrawn' }] },
  ];
  assert.deepEqual(
    availableTeamApplicationSeasons(seasons, registrations).map((season) => season.id),
    ['season-open'],
  );
});

test('duplicate application failures are translated into a plain recovery message', () => {
  assert.equal(
    friendlyTeamsError('Supabase request failed with 400: You already have a team application in this season'),
    'You already have a team application for this season.',
  );
  assert.equal(friendlyTeamsError('Connection interrupted'), 'Connection interrupted');
});

test('active rosters and pending invitations are excluded from captain invite choices', () => {
  const team = {
    seasonId: 'season-active',
    roster: [{ playerId: 'player-rostered' }],
    pendingInvitations: [{ playerId: 'player-pending' }],
  };
  const players = [
    { id: 'player-rostered', display_name: 'Rostered', activeSeasonIds: ['season-active'] },
    { id: 'player-pending', display_name: 'Pending' },
    { id: 'player-other-team', display_name: 'Other team', activeSeasonIds: ['season-active'] },
    { id: 'player-other-season', display_name: 'Other season', activeSeasonIds: ['season-other'] },
    { id: 'player-free', display_name: 'Free player', activeSeasonIds: [] },
  ];

  assert.deepEqual(
    availableInvitationPlayers(team, players).map((player) => player.id),
    ['player-other-season', 'player-free'],
  );
});

test('active-membership invitation failures are translated into an actionable recovery message', () => {
  assert.equal(
    friendlyTeamsError('Supabase request failed with 400: Player already has an active team membership'),
    'Already rostered for this season. Choose someone else.',
  );
});

test('modern Teams document preserves canonical read/write APIs, auth, and legacy escape hatch', () => {
  const html = renderJflModernTeams();
  assert.match(html, /data-fd-modern-teams="true"/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /\/api\/me\/team-membership-requests/);
  assert.match(html, /\/api\/seasons\/.*team-registration\/me/);
  assert.match(html, /\/api\/seasons\/.*team-standings/);
  assert.match(html, /captainName:\s*row\.captain_display_name/);
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
  assert.match(jflModernTeamsStyles, /summary\s*\{[^}]*padding:\s*0\s+12px/s);
  assert.match(jflModernTeamsStyles, /safe-area-inset-bottom/);
  assert.match(jflModernTeamsStyles, /max-width:\s*520px[\s\S]*fd-team-card__roster-action/);
});
