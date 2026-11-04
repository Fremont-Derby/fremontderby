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
  league_teams: [{
    teamId: 'team-other',
    teamName: 'Rail Riders',
    seasonId: 'season-active',
    seasonName: 'Active League Lab',
    captainName: 'Casey Captain',
    rosterCount: 2,
    roster: [
      { playerId: 'other-captain', displayName: 'Casey Captain', role: 'captain' },
      { playerId: 'other-player', displayName: 'Pat Player', role: 'player' },
    ],
  }],
  joinable_teams: [
    { teamId: 'team-other', teamName: 'Rail Riders', seasonId: 'season-active', seasonName: 'Active League Lab' },
    { teamId: 'team-mine', teamName: 'JFL QA Breakers', seasonId: 'season-active', seasonName: 'Active League Lab', hasActiveMembership: true },
  ],
};

test('normalizes captain team first and preserves directory roster context', () => {
  const cards = normalizeTeamCards(management, requests);
  assert.deepEqual(cards.map((card) => card.teamId), ['team-mine', 'team-other']);
  assert.equal(cards[0].relationship, 'captain');
  assert.equal(cards[0].rosterCount, 2);
  assert.equal(cards[1].captainName, 'Casey Captain');
  assert.equal(cards[1].rosterCount, 2);
  assert.equal(cards[1].roster[1].displayName, 'Pat Player');
});

test('compact directory card shows captain and count but player names only inside expansion', () => {
  const card = normalizeTeamCards(management, requests)[1];
  const html = renderTeamCard(card);
  assert.match(html, />Captain</);
  assert.match(html, /Casey Captain/);
  assert.match(html, />Players</);
  assert.match(html, /2 players/);
  assert.match(html, /<details/);
  assert.match(html, /View players/);
  assert.match(html, /Pat Player/);
  assert.doesNotMatch(html, /League team/);
  assert.doesNotMatch(html, /Manage roster/);
});

test('captain card keeps management controls distinct from public roster viewing', () => {
  const html = renderTeamCard(normalizeTeamCards(management, requests)[0]);
  assert.match(html, /My team · Captain/);
  assert.match(html, /Manage roster/);
  assert.match(html, /2 players/);
  assert.doesNotMatch(html, /League team/);
});

test('visible actions remain role-aware', () => {
  assert.deepEqual(visibleTeamActions({ relationship: 'captain' }), ['message']);
  assert.deepEqual(visibleTeamActions({ relationship: 'member' }), ['message']);
  assert.deepEqual(visibleTeamActions({ relationship: 'pending' }), ['cancel']);
  assert.deepEqual(visibleTeamActions({ relationship: 'none' }), ['join']);
  assert.deepEqual(visibleTeamActions({ relationship: 'directory' }), []);
});

test('modern document maps public roster data and persists obvious filter state', () => {
  const html = renderJflModernTeams();
  assert.match(html, /\/api\/seasons\/.*team-standings/);
  assert.match(html, /rosterCount:Number\.isFinite\(Number\(row\.roster_count\)\)/);
  assert.match(html, /roster:Array\.isArray\(row\.roster\)/);
  assert.match(html, /searchParams\.get\('view'\)/);
  assert.match(html, /history\.replaceState/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(
    jflModernTeamsStyles,
    /\.fd-teams \.fd-teams__filters button\[aria-pressed=\"true\"\]/,
  );
  assert.match(jflModernTeamsStyles, /content:'✓ '/);
  assert.match(html, /details\.addEventListener\('toggle',\(\)=>\{syncFilters\(\);/);
  assert.doesNotMatch(html, />League team</);
});

test('modern Teams emits syntactically valid inline browser scripts', () => {
  const html = renderJflModernTeams();
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1]);
  assert.ok(scripts.length > 0);
  for (const source of scripts) assert.doesNotThrow(() => new Function(source));
});

test('route remains JFL GET /teams only', async () => {
  const modern = routeJflModernTeams(new Request('https://jfl.fremontderby.com/teams'), { ENVIRONMENT: 'jfl' });
  assert.ok(modern instanceof Response);
  assert.equal(modern.status, 200);
  assert.match(await modern.text(), /data-fd-modern-teams="true"/);
  assert.equal(routeJflModernTeams(new Request('https://jfl.fremontderby.com/teams?ui=legacy'), { ENVIRONMENT: 'jfl' }), null);
  assert.equal(routeJflModernTeams(new Request('https://jfl.fremontderby.com/teams'), { ENVIRONMENT: 'production' }), null);
});

test('team application helper still excludes seasons with active applications', () => {
  const seasons = [
    { id: 'open', status: 'registration' },
    { id: 'used', status: 'registration' },
  ];
  const registrations = [{ seasonId: 'used', applications: [{ status: 'applied' }] }];
  assert.deepEqual(availableTeamApplicationSeasons(seasons, registrations).map((s) => s.id), ['open']);
});

test('invite helper excludes rostered and pending players', () => {
  const team = {
    seasonId: 'season-active',
    roster: [{ playerId: 'rostered' }],
    pendingInvitations: [{ playerId: 'pending' }],
  };
  const players = [
    { id: 'rostered', activeSeasonIds: ['season-active'] },
    { id: 'pending', activeSeasonIds: [] },
    { id: 'free', activeSeasonIds: [] },
  ];
  assert.deepEqual(availableInvitationPlayers(team, players).map((p) => p.id), ['free']);
});

test('friendly errors remain human-readable', () => {
  assert.equal(
    friendlyTeamsError('Supabase request failed with 400: Player already has an active team membership'),
    'Already rostered for this season. Choose someone else.',
  );
});

test('touch, focus, reduced motion, forced colors, and mobile safe area remain covered', () => {
  assert.match(jflModernTeamsStyles, /min-height:44px/);
  assert.match(jflModernTeamsStyles, /focus-visible/);
  assert.match(jflModernTeamsStyles, /prefers-reduced-motion/);
  assert.match(jflModernTeamsStyles, /forced-colors:active/);
  assert.match(jflModernTeamsStyles, /safe-area-inset-bottom/);
});

// Human acceptance remains on #1773 after the JFL deploy.
